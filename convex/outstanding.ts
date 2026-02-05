import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================
// OUTSTANDING AMOUNT QUERIES
// ============================================

export const list = query({
  args: {
    customerId: v.optional(v.id("customers")),
    branchId: v.optional(v.id("branches")),
    status: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("outstandingAmounts")
      .fullTableScan();

    let results = await query.collect();

    // Filter results
    if (args.customerId) {
      results = results.filter((r) => r.customerId === args.customerId);
    }

    if (args.branchId) {
      results = results.filter((r) => r.branchId === args.branchId);
    }

    if (args.status) {
      results = results.filter((r) => r.status === args.status);
    }

    // Filter by search term if provided
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      results = results.filter(
        (item) =>
          item.customerName.toLowerCase().includes(term) ||
          item.customerPhone?.toLowerCase().includes(term) ||
          item.customerEmail?.toLowerCase().includes(term)
      );
    }

    // Sort results
    if (args.sortBy === "amount") {
      results.sort((a, b) => b.remainingAmount - a.remainingAmount);
    } else if (args.sortBy === "days") {
      results.sort((a, b) => b.outstandingDays - a.outstandingDays);
    } else if (args.sortBy === "name") {
      results.sort((a, b) => a.customerName.localeCompare(b.customerName));
    } else {
      results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    return results;
  },
});

export const getById = query({
  args: { id: v.id("outstandingAmounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCustomerId = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outstandingAmounts")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
  },
});

export const getOutstandingSummary = query({
  args: {},
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("outstandingAmounts")
      .collect();

    const summary = {
      totalOutstanding: 0,
      totalResolved: 0,
      totalOverdue: 0,
      activeCustomers: 0,
      overdueCustomers: 0,
      byStatus: {
        active: 0,
        resolved: 0,
        overdue: 0,
        partial: 0,
      },
    };

    items.forEach((item) => {
      if (item.status === "resolved") {
        summary.totalResolved += item.totalAmount;
      } else {
        summary.totalOutstanding += item.remainingAmount;
      }

      if (item.status === "overdue") {
        summary.totalOverdue += item.remainingAmount;
        summary.overdueCustomers++;
      } else if (item.status === "active" || item.status === "partial") {
        summary.activeCustomers++;
      }

      summary.byStatus[item.status as keyof typeof summary.byStatus]++;
    });

    return summary;
  },
});

export const getAging = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outstandingAging")
      .collect();
  },
});

// ============================================
// OUTSTANDING AMOUNT MUTATIONS
// ============================================

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    branchId: v.id("branches"),
    branchName: v.string(),
    saleIds: v.array(v.id("sales")),
    totalAmount: v.number(),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const outstandingId = await ctx.db.insert("outstandingAmounts", {
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      branchId: args.branchId,
      branchName: args.branchName,
      saleIds: args.saleIds,
      totalAmount: args.totalAmount,
      paidAmount: 0,
      remainingAmount: args.totalAmount,
      outstandingDays: 0,
      status: "active",
      dueDate: args.dueDate,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: userId.tokenIdentifier as Id<"users">,
      lastModifiedBy: userId.tokenIdentifier as Id<"users">,
    });

    // Initialize aging record
    await ctx.db.insert("outstandingAging", {
      customerId: args.customerId,
      customerName: args.customerName,
      branchId: args.branchId,
      branchName: args.branchName,
      current: args.totalAmount,
      days30_60: 0,
      days60_90: 0,
      days90plus: 0,
      totalOutstanding: args.totalAmount,
      lastUpdated: now,
    });

    return outstandingId;
  },
});

export const addPayment = mutation({
  args: {
    outstandingId: v.id("outstandingAmounts"),
    saleId: v.optional(v.id("sales")),
    saleNumber: v.optional(v.string()),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentDetails: v.optional(
      v.object({
        transactionId: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        chequeNumber: v.optional(v.string()),
        bankName: v.optional(v.string()),
        reference: v.optional(v.string()),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity) throw new Error("Not authenticated");

    const outstanding = await ctx.db.get(args.outstandingId);
    if (!outstanding) throw new Error("Outstanding record not found");

    const now = Date.now();

    // Create payment record
    const paymentId = await ctx.db.insert("outstandingPayments", {
      outstandingId: args.outstandingId,
      customerId: outstanding.customerId,
      customerName: outstanding.customerName,
      saleId: args.saleId,
      saleNumber: args.saleNumber,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentDetails: args.paymentDetails,
      paymentDate: now,
      notes: args.notes,
      branchId: outstanding.branchId,
      branchName: outstanding.branchName,
      recordedBy: userIdentity.tokenIdentifier as Id<"users">,
      recordedByName: userIdentity.name || "Unknown",
    });

    // Update outstanding record
    const newPaidAmount = outstanding.paidAmount + args.amount;
    const newRemainingAmount = Math.max(0, outstanding.remainingAmount - args.amount);
    const newStatus =
      newRemainingAmount === 0
        ? "resolved"
        : newRemainingAmount < outstanding.remainingAmount
        ? "partial"
        : "active";

    await ctx.db.patch(args.outstandingId, {
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      updatedAt: now,
      lastModifiedBy: userIdentity.tokenIdentifier as Id<"users">,
    });

    return paymentId;
  },
});

export const addFollowup = mutation({
  args: {
    outstandingId: v.id("outstandingAmounts"),
    followupType: v.string(),
    description: v.string(),
    promiseAmount: v.optional(v.number()),
    promiseDate: v.optional(v.number()),
    outcome: v.string(),
    notes: v.optional(v.string()),
    nextFollowupDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity) throw new Error("Not authenticated");

    const outstanding = await ctx.db.get(args.outstandingId);
    if (!outstanding) throw new Error("Outstanding record not found");

    return await ctx.db.insert("collectionFollowups", {
      outstandingId: args.outstandingId,
      customerId: outstanding.customerId,
      customerName: outstanding.customerName,
      followupType: args.followupType,
      description: args.description,
      promiseAmount: args.promiseAmount,
      promiseDate: args.promiseDate,
      outcome: args.outcome,
      notes: args.notes,
      nextFollowupDate: args.nextFollowupDate,
      createdAt: Date.now(),
      createdBy: userIdentity.tokenIdentifier as Id<"users">,
      createdByName: userIdentity.name || "Unknown",
    });
  },
});

export const scheduleReminder = mutation({
  args: {
    outstandingId: v.id("outstandingAmounts"),
    reminderType: v.string(),
    scheduledFor: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const outstanding = await ctx.db.get(args.outstandingId);
    if (!outstanding) throw new Error("Outstanding record not found");

    const now = Date.now();
    const daysOverdue = outstanding.dueDate
      ? Math.floor((now - outstanding.dueDate) / (1000 * 60 * 60 * 24))
      : 0;

    return await ctx.db.insert("paymentReminders", {
      outstandingId: args.outstandingId,
      customerId: outstanding.customerId,
      customerName: outstanding.customerName,
      customerPhone: outstanding.customerPhone,
      customerEmail: outstanding.customerEmail,
      remainingAmount: outstanding.remainingAmount,
      reminderType: args.reminderType,
      reminderStatus: "pending",
      message: args.message,
      scheduledFor: args.scheduledFor,
      daysOverdue: daysOverdue,
      createdAt: now,
    });
  },
});

export const getPaymentHistory = query({
  args: { outstandingId: v.id("outstandingAmounts") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("outstandingPayments")
      .collect();

    return payments
      .filter((p) => p.outstandingId === args.outstandingId)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getFollowupHistory = query({
  args: { outstandingId: v.id("outstandingAmounts") },
  handler: async (ctx, args) => {
    const followups = await ctx.db
      .query("collectionFollowups")
      .collect();

    return followups
      .filter((f) => f.outstandingId === args.outstandingId)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getReminderHistory = query({
  args: { outstandingId: v.id("outstandingAmounts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentReminders")
      .withIndex("by_outstanding", (q) => q.eq("outstandingId", args.outstandingId))
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("outstandingAmounts"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
      lastModifiedBy: userIdentity.tokenIdentifier as Id<"users">,
    });
  },
});

export const updateNotes = mutation({
  args: {
    id: v.id("outstandingAmounts"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      notes: args.notes,
      updatedAt: Date.now(),
      lastModifiedBy: userIdentity.tokenIdentifier as Id<"users">,
    });
  },
});

export const deleteOutstanding = mutation({
  args: { id: v.id("outstandingAmounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Update aging information
export const updateAging = mutation({
  args: {
    outstandingId: v.id("outstandingAmounts"),
  },
  handler: async (ctx, args) => {
    const outstanding = await ctx.db.get(args.outstandingId);
    if (!outstanding) throw new Error("Outstanding record not found");

    const now = Date.now();
    const createdAtDate = new Date(outstanding.createdAt);
    const daysOutstanding = Math.floor((now - outstanding.createdAt) / (1000 * 60 * 60 * 24));

    // Update outstanding record with days
    await ctx.db.patch(args.outstandingId, {
      outstandingDays: daysOutstanding,
      status:
        outstanding.status === "resolved"
          ? "resolved"
          : daysOutstanding > 90
          ? "overdue"
          : outstanding.remainingAmount === 0
          ? "resolved"
          : outstanding.paidAmount > 0
          ? "partial"
          : "active",
    });

    // Get or create aging record
    const agingRecords = await ctx.db
      .query("outstandingAging")
      .withIndex("by_customer", (q) => q.eq("customerId", outstanding.customerId))
      .collect();

    const agingRecord = agingRecords.find(
      (r) => r.branchId === outstanding.branchId
    );

    if (!agingRecord) {
      // Create new aging record
      await ctx.db.insert("outstandingAging", {
        customerId: outstanding.customerId,
        customerName: outstanding.customerName,
        branchId: outstanding.branchId,
        branchName: outstanding.branchName,
        current: daysOutstanding <= 30 ? outstanding.remainingAmount : 0,
        days30_60:
          daysOutstanding > 30 && daysOutstanding <= 60
            ? outstanding.remainingAmount
            : 0,
        days60_90:
          daysOutstanding > 60 && daysOutstanding <= 90
            ? outstanding.remainingAmount
            : 0,
        days90plus: daysOutstanding > 90 ? outstanding.remainingAmount : 0,
        totalOutstanding: outstanding.remainingAmount,
        lastUpdated: now,
      });
    } else {
      // Update existing aging record
      const current = daysOutstanding <= 30 ? outstanding.remainingAmount : 0;
      const days30_60 =
        daysOutstanding > 30 && daysOutstanding <= 60
          ? outstanding.remainingAmount
          : 0;
      const days60_90 =
        daysOutstanding > 60 && daysOutstanding <= 90
          ? outstanding.remainingAmount
          : 0;
      const days90plus = daysOutstanding > 90 ? outstanding.remainingAmount : 0;

      await ctx.db.patch(agingRecord._id, {
        current,
        days30_60,
        days60_90,
        days90plus,
        totalOutstanding: outstanding.remainingAmount,
        lastUpdated: now,
      });
    }
  },
});
