import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create return request
export const createReturn = mutation({
  args: {
    orderNumber: v.string(),
    orderId: v.optional(v.id("sales")),
    whatsappOrderId: v.optional(v.id("whatsappOrders")),
    onlineOrderId: v.optional(v.id("onlineOrders")),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      reason: v.string(),
      condition: v.string(),
    })),
    reason: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const returnId = await ctx.db.insert("returns", {
      orderNumber: args.orderNumber,
      orderId: args.orderId,
      whatsappOrderId: args.whatsappOrderId,
      onlineOrderId: args.onlineOrderId,
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      items: args.items,
      reason: args.reason,
      description: args.description,
      status: "pending",
      requestDate: Date.now(),
    });

    return returnId;
  },
});

// Get returns
export const list = query({
  args: {
    status: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    let returns = await ctx.db.query("returns").collect();

    if (args.status) {
      returns = returns.filter(r => r.status === args.status);
    }

    if (args.customerId) {
      returns = returns.filter(r => r.customerId === args.customerId);
    }

    return returns.sort((a, b) => b.requestDate - a.requestDate);
  },
});

// Approve return
export const approveReturn = mutation({
  args: {
    returnId: v.id("returns"),
    refundAmount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const returnRequest = await ctx.db.get(args.returnId);
    if (!returnRequest) throw new Error("Return not found");

    await ctx.db.patch(args.returnId, {
      status: "approved",
      refundAmount: args.refundAmount,
      approvalDate: Date.now(),
      notes: args.notes,
    });
  },
});

// Reject return
export const rejectReturn = mutation({
  args: {
    returnId: v.id("returns"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const returnRequest = await ctx.db.get(args.returnId);
    if (!returnRequest) throw new Error("Return not found");

    await ctx.db.patch(args.returnId, {
      status: "rejected",
      approvalDate: Date.now(),
      notes: args.notes,
    });
  },
});

// Complete return
export const completeReturn = mutation({
  args: {
    returnId: v.id("returns"),
    replacementOrderNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const returnRequest = await ctx.db.get(args.returnId);
    if (!returnRequest) throw new Error("Return not found");

    await ctx.db.patch(args.returnId, {
      status: "completed",
      completionDate: Date.now(),
      replacementOrderNumber: args.replacementOrderNumber,
      notes: args.notes,
    });
  },
});
