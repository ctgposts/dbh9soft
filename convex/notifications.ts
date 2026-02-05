import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Send notification
export const sendNotification = mutation({
  args: {
    orderId: v.optional(v.id("sales")),
    whatsappOrderId: v.optional(v.id("whatsappOrders")),
    onlineOrderId: v.optional(v.id("onlineOrders")),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    notificationType: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("orderNotifications", {
      orderId: args.orderId,
      whatsappOrderId: args.whatsappOrderId,
      onlineOrderId: args.onlineOrderId,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      notificationType: args.notificationType,
      subject: args.subject,
      message: args.message,
      status: "pending",
    });

    // Here you would integrate with actual email/SMS/WhatsApp services
    // For now, just mark as sent
    await ctx.db.patch(notificationId, {
      status: "sent",
      sentAt: Date.now(),
    });

    return notificationId;
  },
});

// Get notifications
export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let notifications = await ctx.db.query("orderNotifications").collect();

    if (args.status) {
      notifications = notifications.filter(n => n.status === args.status);
    }

    return notifications.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Retry failed notification
export const retryNotification = mutation({
  args: { notificationId: v.id("orderNotifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    // Attempt to send again
    await ctx.db.patch(args.notificationId, {
      status: "sent",
      sentAt: Date.now(),
    });
  },
});

// Mark notification as failed
export const markFailed = mutation({
  args: {
    notificationId: v.id("orderNotifications"),
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    await ctx.db.patch(args.notificationId, {
      status: "failed",
      failureReason: args.failureReason,
    });
  },
});
