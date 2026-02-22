import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * স্টাফ প্রোডাক্ট ইমেজ আপলোড API
 */
export const uploadProductImage = mutation({
  args: {
    productId: v.id("products"),
    barcode: v.string(),
    serialNumber: v.string(), // DBH-0001
    variantId: v.number(),
    imageUrl: v.string(), // Base64 or URL from Cloudinary
    imageKey: v.string(), // Storage reference
    originalSize: v.number(),
    compressedSize: v.number(),
    compressionRatio: v.number(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    position: v.number(), // 1, 2, 3
    branchId: v.id("branches"),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    // ভেরিফাই করুন user আছে কিনা
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // ইউজার ID পান
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // ইমেজ ডাটা সংরক্ষণ করুন
    const imageId = await ctx.db.insert("staffProductImages", {
      productId: args.productId,
      barcode: args.barcode,
      serialNumber: args.serialNumber,
      variantId: args.variantId,
      uploadedBy: user._id,
      uploadedByName: user.name || "Unknown",
      uploadedAt: Date.now(),
      imageUrl: args.imageUrl,
      imageKey: args.imageKey,
      originalSize: args.originalSize,
      compressedSize: args.compressedSize,
      compressionRatio: args.compressionRatio,
      format: "JPEG",
      description: args.description,
      tags: args.tags || [],
      position: args.position,
      viewCount: 0,
      likes: 0,
      isApproved: false, // নতুন ইমেজ শুরুতে অপ্রমাণিত
      branchId: args.branchId,
      branchName: args.branchName,
    });

    // অ্যাক্টিভিটি লগ করুন
    await ctx.db.insert("staffProductActivity", {
      staffId: user._id,
      staffName: user.name || "Unknown",
      branchId: args.branchId,
      branchName: args.branchName,
      productId: args.productId,
      productName: "Unknown", // TODO: Fetch from product
      barcode: args.barcode,
      serialNumber: args.serialNumber,
      variantId: args.variantId,
      action: "image_upload",
      details: {
        imageId,
        imageUrl: args.imageUrl,
        fileName: `${args.serialNumber}-${args.position}.jpg`,
      },
      timestamp: Date.now(),
      status: "success",
    });

    return {
      success: true,
      imageId,
      message: `ছবি সফলভাবে আপলোড করা হয়েছে`,
    };
  },
});

/**
 * পণ্যের সকল ইমেজ পান
 */
export const getProductImages = query({
  args: {
    productId: v.id("products"),
    serialNumber: v.optional(v.string()),
    variantId: v.optional(v.number()),
    approvedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("staffProductImages");

    // ফিল্টার করুন
    if (args.serialNumber) {
      query = query.filter((q) =>
        q.eq(q.field("serialNumber"), args.serialNumber)
      );
    } else {
      query = query.filter((q) => q.eq(q.field("productId"), args.productId));
    }

    if (args.variantId) {
      query = query.filter((q) => q.eq(q.field("variantId"), args.variantId));
    }

    if (args.approvedOnly) {
      query = query.filter((q) => q.eq(q.field("isApproved"), true));
    }

    const images = await query
      .order("desc") // সর্বশেষ প্রথম
      .collect();

    return images.map((img) => ({
      _id: img._id,
      imageUrl: img.imageUrl,
      position: img.position,
      uploadedBy: img.uploadedByName,
      uploadedAt: new Date(img.uploadedAt).toLocaleDateString("bn-BD"),
      description: img.description,
      isApproved: img.isApproved,
      likes: img.likes,
      viewCount: img.viewCount,
      compressionRatio: img.compressionRatio,
    }));
  },
});

/**
 * সর্বশেষ স্ক্যান করা বারকোড পান
 */
export const getScanHistory = query({
  args: {
    staffId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const history = await ctx.db
      .query("staffProductActivity")
      .filter((q) => q.eq(q.field("staffId"), args.staffId))
      .filter((q) => q.eq(q.field("action"), "scan"))
      .order("desc") // সর্বশেষ প্রথম
      .take(limit);

    return history.map((h) => ({
      barcode: h.barcode,
      serialNumber: h.serialNumber,
      productName: h.productName,
      timestamp: new Date(h.timestamp).toLocaleTimeString("bn-BD"),
    }));
  },
});

/**
 * ইমেজ অনুমোদন করুন (ম্যানেজার অনলি)
 */
export const approveImage = mutation({
  args: {
    imageId: v.id("staffProductImages"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // ম্যানেজার ভেরিফিকেশন যোগ করুন (Phase 3 এ সম্পূর্ণ হবে)
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // ইমেজ আপডেট করুন
    await ctx.db.patch(args.imageId, {
      isApproved: args.approved,
      approvedBy: user._id,
      approvedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * ইমেজ লাইক করুন
 */
export const toggleImageLike = mutation({
  args: {
    imageId: v.id("staffProductImages"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    // লাইক সংখ্যা বৃদ্ধি করুন
    await ctx.db.patch(args.imageId, {
      likes: image.likes + 1,
    });

    return { success: true, newLikes: image.likes + 1 };
  },
});

/**
 * ইমেজ ভিউ কাউন্ট বৃদ্ধি করুন
 */
export const incrementImageView = mutation({
  args: {
    imageId: v.id("staffProductImages"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    await ctx.db.patch(args.imageId, {
      viewCount: image.viewCount + 1,
    });

    return { success: true };
  },
});

/**
 * ইমেজ মুছে দিন
 */
export const deleteImage = mutation({
  args: {
    imageId: v.id("staffProductImages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const image = await ctx.db.get(args.imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    // পার্মিশন চেক - শুধু মালিক বা ম্যানেজার মুছতে পারবেন
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user._id !== image.uploadedBy && (user as any).role !== "admin")) {
      throw new Error("Permission denied");
    }

    // ইমেজ ডিলিট করুন
    await ctx.db.delete(args.imageId);

    // অ্যাক্টিভিটি লগ করুন
    await ctx.db.insert("staffProductActivity", {
      staffId: user._id,
      staffName: user.name || "Unknown",
      branchId: image.branchId,
      branchName: image.branchName,
      productId: image.productId,
      action: "image_delete",
      details: {
        imageId: args.imageId,
        fileName: `${image.serialNumber}-${image.position}.jpg`,
      },
      timestamp: Date.now(),
      status: "success",
    });

    return { success: true, message: "ছবি মুছে দেওয়া হয়েছে" };
  },
});

/**
 * স্টাফ অ্যাক্টিভিটি স্ট্যাটিস্টিক্স পান
 */
export const getStaffStats = query({
  args: {
    staffId: v.optional(v.id("users")),
    branchId: v.optional(v.id("branches")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // স্ক্যান সংখ্যা
    let scanQuery = ctx.db.query("staffProductActivity").filter((q) =>
      q.gte(q.field("timestamp"), startTime)
    );

    if (args.staffId) {
      scanQuery = scanQuery.filter((q) =>
        q.eq(q.field("staffId"), args.staffId)
      );
    }
    if (args.branchId) {
      scanQuery = scanQuery.filter((q) =>
        q.eq(q.field("branchId"), args.branchId)
      );
    }

    const activities = await scanQuery.collect();
    const scanCount = activities.filter((a) => a.action === "scan").length;
    const uploadCount = activities.filter((a) => a.action === "image_upload")
      .length;

    // ইমেজ সংখ্যা
    let imageQuery = ctx.db.query("staffProductImages").filter((q) =>
      q.gte(q.field("uploadedAt"), startTime)
    );

    if (args.staffId) {
      imageQuery = imageQuery.filter((q) =>
        q.eq(q.field("uploadedBy"), args.staffId)
      );
    }
    if (args.branchId) {
      imageQuery = imageQuery.filter((q) =>
        q.eq(q.field("branchId"), args.branchId)
      );
    }

    const images = await imageQuery.collect();
    const totalImageSize = images.reduce((sum, img) => sum + img.compressedSize, 0);

    return {
      scanCount,
      uploadCount,
      imageCount: images.length,
      totalImageSize,
      avgCompressionRatio:
        images.length > 0
          ? (
              images.reduce((sum, img) => sum + img.compressionRatio, 0) /
              images.length
            ).toFixed(2)
          : 0,
      period: `${days} দিন`,
    };
  },
});
