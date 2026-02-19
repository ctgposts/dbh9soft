import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    branchId: v.optional(v.id("branches")),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let orders = await ctx.db.query("whatsappOrders").collect();
    
    if (args.branchId) {
      orders = orders.filter(o => o.branchId === args.branchId);
    }
    
    if (args.status) {
      orders = orders.filter(o => o.status === args.status);
    }
    
    if (args.assignedTo) {
      orders = orders.filter(o => o.assignedTo === args.assignedTo);
    }
    
    return orders.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: { id: v.id("whatsappOrders") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerWhatsApp: v.string(),
    items: v.array(v.object({
      productId: v.optional(v.id("products")),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
      color: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    subtotal: v.number(),
    discount: v.number(),
    deliveryCharge: v.number(),
    total: v.number(),
    branchId: v.id("branches"),
    deliveryAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const branch = await ctx.db.get(args.branchId);
    if (!branch) throw new Error("Branch not found");

    // Generate order number
    const orderCount = await ctx.db.query("whatsappOrders").collect();
    const orderNumber = `WA${Date.now().toString().slice(-6)}${(orderCount.length + 1).toString().padStart(3, '0')}`;

    const orderId = await ctx.db.insert("whatsappOrders", {
      orderNumber,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerWhatsApp: args.customerWhatsApp,
      items: args.items,
      subtotal: args.subtotal,
      discount: args.discount,
      deliveryCharge: args.deliveryCharge,
      total: args.total,
      status: "pending",
      branchId: args.branchId,
      branchName: branch.name,
      deliveryAddress: args.deliveryAddress,
      notes: args.notes,
    });

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("whatsappOrders"),
    status: v.string(),
    assignedTo: v.optional(v.id("employees")),
    assignedToName: v.optional(v.string()),
    deliveryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const convertToSale = mutation({
  args: {
    orderId: v.id("whatsappOrders"),
    paymentMethod: v.string(),
    paidAmount: v.number(),
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
    const saleNumber = `S${Date.now().toString().slice(-6)}${(salesCount.length + 1).toString().padStart(4, '0')}`;

    // Convert WhatsApp order items to sale items
    const saleItems = order.items.map(item => ({
      productId: item.productId!,
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
      tax: 0,
      discount: order.discount,
      total: order.total,
      paidAmount: args.paidAmount,
      dueAmount: order.total - args.paidAmount,
      paymentMethod: args.paymentMethod,
      status: args.paidAmount >= order.total ? "completed" : "partial",
      cashierId: userId,
      cashierName: user.name || user.email || "Unknown",
      employeeId: order.assignedTo,
      employeeName: order.assignedToName,
      deliveryInfo: order.deliveryAddress ? {
        type: "delivery",
        address: order.deliveryAddress,
        phone: order.customerPhone,
        charges: order.deliveryCharge,
      } : { type: "pickup" },
    });

    // Update stock for each item
    for (const item of order.items) {
      if (item.productId) {
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
            reason: "WhatsApp Sale",
            reference: saleNumber,
            userId,
            userName: user.name || user.email || "Unknown",
            employeeId: order.assignedTo,
            employeeName: order.assignedToName,
            previousStock: branchStock?.currentStock || 0,
            newStock: (branchStock?.currentStock || 0) - item.quantity,
          });
        }
      }
    }

    // Update order status
    await ctx.db.patch(args.orderId, {
      status: "delivered",
    });

    return saleId;
  },
});

export const getStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    let orders = await ctx.db.query("whatsappOrders").collect();

    if (args.branchId) {
      orders = orders.filter(o => o.branchId === args.branchId);
    }

    if (args.startDate && args.endDate) {
      orders = orders.filter(o => 
        o._creationTime >= args.startDate! && o._creationTime <= args.endDate!
      );
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
    const deliveredOrders = orders.filter(o => o.status === "delivered").length;
    const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

    const totalRevenue = orders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const averageOrderValue = deliveredOrders > 0 
      ? totalRevenue / deliveredOrders 
      : 0;

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue,
      conversionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
    };
  },
});
