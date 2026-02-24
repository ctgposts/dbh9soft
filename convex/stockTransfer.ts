import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    branchId: v.optional(v.id("branches")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    const allTransfers = await ctx.db.query("stockTransfers").collect();

    let transfers = allTransfers;
    
    if (args.branchId) {
      transfers = transfers.filter((t: any) => t.sourceBranchId === args.branchId);
    }

    // Filter by status if provided
    if (args.status) {
      transfers = transfers.filter((t: any) => t.status === args.status);
    }

    return transfers;
  },
});

export const get = query({
  args: { id: v.id("stockTransfers") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    sourceBranchId: v.id("branches"),
    sourceBranchName: v.string(),
    destinationBranchId: v.id("branches"),
    destinationBranchName: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        currentStock: v.number(),
      })
    ),
    notes: v.optional(v.string()),
    requestedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate that source and destination are different
    if (args.sourceBranchId === args.destinationBranchId) {
      throw new Error("Source and destination branches must be different");
    }

    // Validate stock availability
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product ${item.productName} not found`);

      // Find stock in source branch
      const branchStock = product.branchStock?.find(
        (bs: any) => bs.branchId === args.sourceBranchId
      );
      if (!branchStock || branchStock.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productName} in source branch`
        );
      }
    }

    const transferId = await ctx.db.insert("stockTransfers", {
      transferNumber: `ST-${Date.now()}`,
      sourceBranchId: args.sourceBranchId,
      sourceBranchName: args.sourceBranchName,
      destinationBranchId: args.destinationBranchId,
      destinationBranchName: args.destinationBranchName,
      items: args.items,
      status: "pending",
      notes: args.notes || "",
      requestedBy: args.requestedBy || "System",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      approvedAt: undefined,
      completedAt: undefined,
    });

    return transferId;
  },
});

export const approve = mutation({
  args: {
    id: v.id("stockTransfers"),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transfer = await ctx.db.get(args.id);
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "pending") {
      throw new Error("Can only approve pending transfers");
    }

    await ctx.db.patch(args.id, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const ship = mutation({
  args: {
    id: v.id("stockTransfers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transfer = await ctx.db.get(args.id);
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "approved") {
      throw new Error("Can only ship approved transfers");
    }

    // Deduct stock from source branch
    for (const item of transfer.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found`);

      const updatedBranchStock = product.branchStock.map((bs: any) => {
        if (bs.branchId === transfer.sourceBranchId) {
          return {
            ...bs,
            currentStock: bs.currentStock - item.quantity,
          };
        }
        return bs;
      });

      // Update global stock
      const newGlobalStock =
        product.currentStock - item.quantity;

      await ctx.db.patch(item.productId, {
        branchStock: updatedBranchStock,
        currentStock: newGlobalStock,
      });

      // Log transaction
      await ctx.db.insert("inventoryTransactions", {
        productId: item.productId,
        productName: item.productName,
        branchId: transfer.sourceBranchId,
        branchName: transfer.sourceBranchName,
        type: "stock_transfer_out",
        quantity: item.quantity,
        notes: `Transfer to ${transfer.destinationBranchName}`,
        referenceId: args.id,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      status: "in_transit",
      shippedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const receive = mutation({
  args: {
    id: v.id("stockTransfers"),
    receivedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transfer = await ctx.db.get(args.id);
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "in_transit") {
      throw new Error("Can only receive in-transit transfers");
    }

    // Add stock to destination branch
    for (const item of transfer.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found`);

      const updatedBranchStock = product.branchStock.map((bs: any) => {
        if (bs.branchId === transfer.destinationBranchId) {
          return {
            ...bs,
            currentStock: bs.currentStock + item.quantity,
          };
        }
        return bs;
      });

      // NOTE: Do NOT update global stock here - it was already updated during ship
      // The global stock decreases when shipped from source, and is already accounted for.
      // We only update the destination branch stock here.

      await ctx.db.patch(item.productId, {
        branchStock: updatedBranchStock,
      });

      // Log transaction
      await ctx.db.insert("inventoryTransactions", {
        productId: item.productId,
        productName: item.productName,
        branchId: transfer.destinationBranchId,
        branchName: transfer.destinationBranchName,
        type: "stock_transfer_in",
        quantity: item.quantity,
        notes: `Received from ${transfer.sourceBranchName}`,
        referenceId: args.id,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
      receivedBy: args.receivedBy,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const cancel = mutation({
  args: {
    id: v.id("stockTransfers"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transfer = await ctx.db.get(args.id);
    if (!transfer) throw new Error("Transfer not found");
    if (
      transfer.status !== "pending" &&
      transfer.status !== "approved"
    ) {
      throw new Error("Can only cancel pending or approved transfers");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      cancelReason: args.reason,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const getTransferHistory = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    // Get all transfers for this branch (both incoming and outgoing)
    const allTransfers = await ctx.db.query("stockTransfers").collect();
    
    const outgoing = allTransfers
      .filter((t: any) => t.sourceBranchId === args.branchId)
      .sort((a: any, b: any) => b.createdAt - a.createdAt);

    const incoming = allTransfers
      .filter((t: any) => t.destinationBranchId === args.branchId)
      .sort((a: any, b: any) => b.createdAt - a.createdAt);

    return { outgoing, incoming };
  },
});

export const getStatistics = query({
  args: {
    branchId: v.optional(v.id("branches")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const allTransfers = await ctx.db.query("stockTransfers").collect();

    let filtered = allTransfers;
    
    if (args.branchId) {
      filtered = filtered.filter((t: any) => t.sourceBranchId === args.branchId);
    }

    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      filtered = filtered.filter(
        (t: any) =>
          t.createdAt >= args.startDate! &&
          t.createdAt <= args.endDate!
      );
    }

    const stats = {
      totalTransfers: filtered.length,
      completed: filtered.filter(
        (t: any) => t.status === "completed"
      ).length,
      pending: filtered.filter(
        (t: any) => t.status === "pending"
      ).length,
      approved: filtered.filter(
        (t: any) => t.status === "approved"
      ).length,
      inTransit: filtered.filter(
        (t: any) => t.status === "in_transit"
      ).length,
      cancelled: filtered.filter(
        (t: any) => t.status === "cancelled"
      ).length,
      totalItemsTransferred: filtered.reduce(
        (sum: number, t: any) =>
          sum +
          t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0),
        0
      ),
    };

    return stats;
  },
});
