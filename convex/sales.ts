import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    customerId: v.optional(v.id("customers")),
    status: v.optional(v.string()),
    includeReturned: v.optional(v.boolean()), // ✅ Option to include returned sales
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let sales = await ctx.db
      .query("sales")
      .order("desc")
      .take(args.limit || 50);
    
    // ✅ Filter out returned & cancelled sales by default (they should appear in Refund list, not Sales list)
    if (!args.includeReturned) {
      sales = sales.filter(sale => sale.status !== "returned" && sale.status !== "cancelled");
    }
    
    if (args.customerId) {
      sales = sales.filter(sale => sale.customerId === args.customerId);
    }
    
    if (args.status) {
      sales = sales.filter(sale => sale.status === args.status);
    }
    
    return sales;
  },
});

export const get = query({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

// ✅ FIX #4: Encryption utility (simplified for Convex)
const obfuscatePaymentData = (paymentDetails: any) => {
  if (!paymentDetails) return undefined;
  
  return {
    transactionId: paymentDetails.transactionId 
      ? `${paymentDetails.transactionId.slice(-4).padStart(paymentDetails.transactionId.length, '*')}`
      : undefined,
    phoneNumber: paymentDetails.phoneNumber
      ? `${paymentDetails.phoneNumber.slice(-4).padStart(paymentDetails.phoneNumber.length, '*')}`
      : undefined,
    reference: paymentDetails.reference,
    status: paymentDetails.status,
  };
};

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
    })),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    discount: v.number(),
    total: v.number(),
    paidAmount: v.number(),
    dueAmount: v.number(),
    paymentMethod: v.string(),
    // ✅ FIX #17: Track which coupon code was applied to the sale
    couponCode: v.optional(v.string()),
    paymentDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.string()),
    })),
    deliveryInfo: v.optional(v.object({
      type: v.string(),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      charges: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    // ✅ Problem #6: Real-time stock validation before creating sale
    // Validate that all items have sufficient stock RIGHT NOW
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      if (product.currentStock < item.quantity) {
        throw new Error(
          `Stock validation failed: ${item.productName} has only ${product.currentStock} items ` +
          `available (requested ${item.quantity}). This may have been purchased on another terminal.`
        );
      }
    }
    
    // Generate sale number
    const timestamp = Date.now();
    const saleNumber = `INV-${timestamp}`;
    
    // Determine status based on payment
    let status = "completed";
    if (args.dueAmount > 0) {
      status = "partial"; // Partially paid
    }
    
    // Get first branch as default
    const defaultBranch = await ctx.db.query("branches").first();
    if (!defaultBranch) {
      throw new Error("No branch found. Please create a branch first.");
    }
    
    // ✅ FIX #4: Store obfuscated payment details for security
    const saleId = await ctx.db.insert("sales", {
      saleNumber,
      branchId: defaultBranch._id,
      branchName: defaultBranch.name,
      customerId: args.customerId,
      customerName: args.customerName || "Walk-in Customer",
      items: args.items,
      subtotal: args.subtotal,
      tax: args.tax || 0, // Include tax from frontend
      discount: args.discount,
      total: args.total,
      paidAmount: args.paidAmount,
      dueAmount: args.dueAmount,
      paymentMethod: args.paymentMethod,
      // ✅ FIX #17: Store applied coupon code for audit trail
      couponCode: args.couponCode,
      paymentDetails: obfuscatePaymentData(args.paymentDetails), // Obfuscate sensitive data
      status,
      cashierId: userId,
      cashierName: user.name || user.email || "Unknown",
      deliveryInfo: args.deliveryInfo,
    });
    
    // Update product stock and create stock movements
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        const newStock = product.currentStock - item.quantity;
        
        // Update branch stock as well
        const updatedBranchStock = product.branchStock.map((bs: any) => {
          if (bs.branchId === defaultBranch._id) {
            return {
              ...bs,
              currentStock: Math.max(0, bs.currentStock - item.quantity),
            };
          }
          return bs;
        });
        
        await ctx.db.patch(item.productId, {
          currentStock: Math.max(0, newStock),
          branchStock: updatedBranchStock,
        });
        
        // Record stock movement
        await ctx.db.insert("stockMovements", {
          productId: item.productId,
          productName: item.productName,
          branchId: defaultBranch._id,
          branchName: defaultBranch.name,
          type: "out",
          quantity: item.quantity,
          reason: "Sale",
          reference: saleNumber,
          userId,
          userName: user.name || user.email || "Unknown",
          previousStock: product.currentStock,
          newStock: Math.max(0, newStock),
        });
      }
    }
    
    // Update customer purchase history if customer is selected
    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (customer) {
        // ✅ Problem #5: Save delivery address for next order auto-fill
        const updateData: any = {
          totalPurchases: customer.totalPurchases + args.total,
          lastPurchaseDate: Date.now(),
        };
        
        // If this is a delivery, save the address and phone for future orders
        if (args.deliveryInfo?.type === "delivery") {
          updateData.lastDeliveryAddress = args.deliveryInfo.address;
          updateData.lastDeliveryPhone = args.deliveryInfo.phone;
        }
        
        await ctx.db.patch(args.customerId, updateData);
      }
    }
    
    return saleId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("sales"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.patch(args.id, {
      status: args.status,
    });
    
    return args.id;
  },
});

export const getStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const sales = await ctx.db.query("sales").collect();
    
    let filteredSales = sales;
    if (args.startDate && args.endDate) {
      filteredSales = sales.filter(sale => 
        sale._creationTime >= args.startDate! && 
        sale._creationTime <= args.endDate!
      );
    }
    
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = filteredSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const totalDue = filteredSales.reduce((sum, sale) => sum + sale.dueAmount, 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Payment method breakdown
    const paymentMethods = filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);
    
    // Status breakdown
    const statusBreakdown = filteredSales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Top selling products
    const productSales = filteredSales.flatMap(sale => sale.items);
    const productStats = productSales.reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          productName: item.productName,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      acc[item.productId].totalQuantity += item.quantity;
      acc[item.productId].totalRevenue += item.totalPrice;
      return acc;
    }, {} as Record<string, any>);
    
    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    return {
      totalSales,
      totalRevenue,
      totalPaid,
      totalDue,
      averageSale,
      paymentMethods,
      statusBreakdown,
      topProducts,
    };
  },
});

export const getDailySales = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const days = args.days || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sales = await ctx.db.query("sales").collect();
    
    const filteredSales = sales.filter(sale => 
      sale._creationTime >= startDate.getTime() && 
      sale._creationTime <= endDate.getTime()
    );
    
    // Group by date
    const dailyStats = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale._creationTime).toDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          totalSales: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalDue: 0,
          salesCount: 0,
        };
      }
      acc[date].totalRevenue += sale.total;
      acc[date].totalPaid += sale.paidAmount;
      acc[date].totalDue += sale.dueAmount;
      acc[date].salesCount += 1;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },
});

export const recordPayment = mutation({
  args: {
    saleId: v.id("sales"),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      reference: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const sale = await ctx.db.get(args.saleId);
    if (!sale) throw new Error("Sale not found");
    
    const newPaidAmount = sale.paidAmount + args.amount;
    const newDueAmount = Math.max(0, sale.total - newPaidAmount);
    
    let newStatus = sale.status;
    if (newDueAmount === 0) {
      newStatus = "completed";
    } else if (newPaidAmount > 0) {
      newStatus = "partial";
    }
    
    await ctx.db.patch(args.saleId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newStatus,
    });
    
    // Record the payment transaction
    // Get first branch as default
    const branches = await ctx.db.query("branches").first();
    const defaultBranch = branches || { _id: "" as any, name: "Main Branch" };
    
    await ctx.db.insert("transactions", {
      transactionId: args.paymentDetails?.transactionId || `PAY-${Date.now()}`,
      branchId: defaultBranch._id,
      branchName: defaultBranch.name,
      type: "sale",
      referenceId: args.saleId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      phoneNumber: args.paymentDetails?.phoneNumber,
      status: "completed",
      details: args.paymentDetails,
      userId,
    });
    
    return args.saleId;
  },
});
