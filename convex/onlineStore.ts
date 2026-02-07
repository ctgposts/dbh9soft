import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Online Products Management
export const listOnlineProducts = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    featured: v.optional(v.boolean()),
    isOnline: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let onlineProducts = await ctx.db.query("onlineProducts").collect();
    
    if (args.isOnline !== undefined) {
      onlineProducts = onlineProducts.filter(op => op.isOnline === args.isOnline);
    }
    
    if (args.featured !== undefined) {
      onlineProducts = onlineProducts.filter(op => op.featured === args.featured);
    }

    // Get product details
    const productsWithDetails = await Promise.all(
      onlineProducts.map(async (op) => {
        const product = await ctx.db.get(op.productId);
        if (!product) return null;
        
        if (args.categoryId && product.categoryId !== args.categoryId) {
          return null;
        }
        
        return {
          ...op,
          product,
        };
      })
    );

    return productsWithDetails
      .filter(p => p !== null)
      .sort((a, b) => a!.sortOrder - b!.sortOrder);
  },
});

export const getOnlineProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const onlineProduct = await ctx.db
      .query("onlineProducts")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();
    
    if (!onlineProduct) return null;
    
    const product = await ctx.db.get(args.productId);
    return { ...onlineProduct, product };
  },
});

export const updateOnlineProduct = mutation({
  args: {
    productId: v.id("products"),
    isOnline: v.boolean(),
    onlinePrice: v.optional(v.number()),
    onlineDiscount: v.optional(v.number()),
    onlineDescription: v.optional(v.string()),
    onlineImages: v.optional(v.array(v.string())),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featured: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { productId, ...updateData } = args;

    const existingOnlineProduct = await ctx.db
      .query("onlineProducts")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .first();

    // ✅ FIX #18: Sync online price to inventory product if onlinePrice is changed
    if (args.onlinePrice && args.onlinePrice > 0) {
      const product = await ctx.db.get(productId);
      if (product) {
        await ctx.db.patch(productId, {
          sellingPrice: args.onlinePrice,
        });
      }
    }

    if (existingOnlineProduct) {
      await ctx.db.patch(existingOnlineProduct._id, updateData);
      return existingOnlineProduct._id;
    } else {
      return await ctx.db.insert("onlineProducts", {
        productId,
        ...updateData,
      });
    }
  },
});

// Online Orders Management
export const listOnlineOrders = query({
  args: {
    branchId: v.optional(v.id("branches")),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let orders = await ctx.db.query("onlineOrders").collect();
    
    if (args.branchId) {
      orders = orders.filter(o => o.branchId === args.branchId);
    }
    
    if (args.status) {
      orders = orders.filter(o => o.status === args.status);
    }
    
    if (args.paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === args.paymentStatus);
    }
    
    return orders.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getOnlineOrder = query({
  args: { id: v.id("onlineOrders") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const createOnlineOrder = mutation({
  args: {
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
      color: v.optional(v.string()),
    })),
    subtotal: v.number(),
    discount: v.number(),
    shippingCharge: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod: v.string(),
    shippingAddress: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      postalCode: v.optional(v.string()),
    }),
    branchId: v.id("branches"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const branch = await ctx.db.get(args.branchId);
    if (!branch) throw new Error("Branch not found");

    // Generate order number
    const orderCount = await ctx.db.query("onlineOrders").collect();
    const orderNumber = `ON${Date.now().toString().slice(-6)}${(orderCount.length + 1).toString().padStart(4, '0')}`;

    const orderId = await ctx.db.insert("onlineOrders", {
      orderNumber,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      items: args.items,
      subtotal: args.subtotal,
      discount: args.discount,
      shippingCharge: args.shippingCharge,
      tax: args.tax,
      total: args.total,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      shippingAddress: args.shippingAddress,
      branchId: args.branchId,
      branchName: branch.name,
      notes: args.notes,
    });

    return orderId;
  },
});

export const updateOnlineOrderStatus = mutation({
  args: {
    id: v.id("onlineOrders"),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    assignedTo: v.optional(v.id("employees")),
    trackingNumber: v.optional(v.string()),
    estimatedDelivery: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updateData } = args;
    
    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, cleanUpdateData);
    return id;
  },
});

export const fulfillOnlineOrder = mutation({
  args: {
    orderId: v.id("onlineOrders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Generate sale number
    const salesCount = await ctx.db.query("sales").collect();
    const saleNumber = `OS${Date.now().toString().slice(-6)}${(salesCount.length + 1).toString().padStart(4, '0')}`;

    // Convert online order items to sale items
    const saleItems = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      size: item.size,
    }));

    // Create sale
    const saleId = await ctx.db.insert("sales", {
      saleNumber,
      branchId: order.branchId,
      branchName: order.branchName,
      customerName: order.customerName,
      items: saleItems,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      paidAmount: order.total, // Assuming online orders are paid
      dueAmount: 0,
      paymentMethod: order.paymentMethod,
      status: "completed",
      cashierId: userId,
      cashierName: user.name || user.email || "Unknown",
      employeeId: order.assignedTo,
      deliveryInfo: {
        type: "delivery",
        address: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
        phone: order.shippingAddress.phone,
        charges: order.shippingCharge,
      },
    });

    // Update stock for each item
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        // Update branch stock
        const updatedBranchStock = product.branchStock.map(bs => {
          if (bs.branchId === order.branchId) {
            return { ...bs, currentStock: bs.currentStock - item.quantity };
          }
          return bs;
        });

        // Update global stock
        const newGlobalStock = product.currentStock - item.quantity;

        await ctx.db.patch(item.productId, {
          branchStock: updatedBranchStock,
          currentStock: newGlobalStock,
        });

        // Record stock movement
        const branchStock = product.branchStock.find(bs => bs.branchId === order.branchId);
        await ctx.db.insert("stockMovements", {
          productId: item.productId,
          productName: item.productName,
          branchId: order.branchId,
          branchName: order.branchName,
          type: "out",
          quantity: item.quantity,
          reason: "Online Sale",
          reference: saleNumber,
          userId,
          userName: user.name || user.email || "Unknown",
          employeeId: order.assignedTo,
          previousStock: branchStock?.currentStock || 0,
          newStock: (branchStock?.currentStock || 0) - item.quantity,
        });
      }
    }

    // Update order status
    await ctx.db.patch(args.orderId, {
      status: "shipped",
      paymentStatus: "paid",
    });

    return saleId;
  },
});

export const getOnlineStoreStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    let orders = await ctx.db.query("onlineOrders").collect();

    if (args.startDate && args.endDate) {
      orders = orders.filter(o => 
        o._creationTime >= args.startDate! && o._creationTime <= args.endDate!
      );
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const shippedOrders = orders.filter(o => o.status === "shipped").length;
    const deliveredOrders = orders.filter(o => o.status === "delivered").length;
    const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

    const totalRevenue = orders
      .filter(o => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    const averageOrderValue = deliveredOrders > 0 
      ? totalRevenue / deliveredOrders 
      : 0;

    // Get online products count
    const onlineProducts = await ctx.db.query("onlineProducts").collect();
    const activeOnlineProducts = onlineProducts.filter(op => op.isOnline).length;

    return {
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue,
      activeOnlineProducts,
      conversionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
    };
  },
});
