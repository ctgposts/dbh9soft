import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * স্টাফ প্রোডাক্ট সেটিংস আপডেট করুন
 */
export const updateStaffProductSettings = mutation({
  args: {
    branchId: v.id("branches"),
    imageCompressionEnabled: v.optional(v.boolean()),
    targetImageSize: v.optional(v.number()),
    jpegQuality: v.optional(v.number()),
    maxImagesPerProduct: v.optional(v.number()),
    allowImageDeletion: v.optional(v.boolean()),
    enableAutoRotate: v.optional(v.boolean()),
    autoDeleteOldImages: v.optional(v.number()),
    enableFlashSupport: v.optional(v.boolean()),
    continuousScan: v.optional(v.boolean()),
    soundNotifications: v.optional(v.boolean()),
    vibrationFeedback: v.optional(v.boolean()),
    enableCollaborativeNotes: v.optional(v.boolean()),
    enableImageLiking: v.optional(v.boolean()),
    enableDailyReport: v.optional(v.boolean()),
    canView: v.optional(v.array(v.string())),
    canUpload: v.optional(v.array(v.string())),
    canDelete: v.optional(v.array(v.string())),
    canApprove: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user as any).role !== "admin") {
      throw new Error("Admin access required");
    }

    // বিদ্যমান সেটিংস খুঁজুন অথবা নতুন তৈরি করুন
    let settings = await ctx.db
      .query("staffProductSettings")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .first();

    const settingsData = {
      imageCompressionEnabled: args.imageCompressionEnabled ?? true,
      targetImageSize: args.targetImageSize ?? 100,
      jpegQuality: args.jpegQuality ?? 85,
      maxImagesPerProduct: args.maxImagesPerProduct ?? 3,
      allowImageDeletion: args.allowImageDeletion ?? true,
      enableAutoRotate: args.enableAutoRotate ?? true,
      autoDeleteOldImages: args.autoDeleteOldImages ?? 0,
      enableFlashSupport: args.enableFlashSupport ?? true,
      continuousScan: args.continuousScan ?? false,
      soundNotifications: args.soundNotifications ?? true,
      vibrationFeedback: args.vibrationFeedback ?? true,
      enableCollaborativeNotes: args.enableCollaborativeNotes ?? true,
      enableImageLiking: args.enableImageLiking ?? true,
      enableDailyReport: args.enableDailyReport ?? false,
      canView: args.canView ?? ["staff", "manager", "admin"],
      canUpload: args.canUpload ?? ["staff", "manager", "admin"],
      canDelete: args.canDelete ?? ["manager", "admin"],
      canApprove: args.canApprove ?? ["manager", "admin"],
      updatedBy: user._id,
      updatedAt: Date.now(),
    };

    if (settings) {
      await ctx.db.patch(settings._id, settingsData);
      return { success: true, settingsId: settings._id, isNew: false };
    } else {
      const settingsId = await ctx.db.insert("staffProductSettings", {
        branchId: args.branchId,
        ...settingsData,
      });
      return { success: true, settingsId, isNew: true };
    }
  },
});

/**
 * স্টাফ প্রোডাক্ট সেটিংস পান
 */
export const getStaffProductSettings = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // ডিফল্ট সেটিংস
    const defaultSettings = {
      imageCompressionEnabled: true,
      targetImageSize: 100,
      jpegQuality: 85,
      maxImagesPerProduct: 3,
      allowImageDeletion: true,
      enableAutoRotate: true,
      autoDeleteOldImages: 0,
      enableFlashSupport: true,
      continuousScan: false,
      soundNotifications: true,
      vibrationFeedback: true,
      enableCollaborativeNotes: true,
      enableImageLiking: true,
      enableDailyReport: false,
      canView: ["staff", "manager", "admin"],
      canUpload: ["staff", "manager", "admin"],
      canDelete: ["manager", "admin"],
      canApprove: ["manager", "admin"],
    };

    // ডাটাবেস থেকে খুঁজুন
    const settings = await ctx.db
      .query("staffProductSettings")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .first();

    if (settings) {
      return { ...defaultSettings, ...settings };
    }

    return defaultSettings;
  },
});

/**
 * সেটিংস রিসেট করুন ডিফল্টে
 */
export const resetStaffProductSettings = mutation({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user as any).role !== "admin") {
      throw new Error("Admin access required");
    }

    const settings = await ctx.db
      .query("staffProductSettings")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .first();

    if (settings) {
      await ctx.db.delete(settings._id);
    }

    return { success: true, message: "সেটিংস রিসেট করা হয়েছে" };
  },
});
