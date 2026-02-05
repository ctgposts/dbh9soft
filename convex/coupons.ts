import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create coupon
export const create = mutation({
  args: {
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.string(),
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.number(),
    applicableProducts: v.optional(v.array(v.id("products"))),
    applicableCategories: v.optional(v.array(v.id("categories"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if coupon code already exists
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("Coupon code already exists");
    }

    return await ctx.db.insert("coupons", {
      code: args.code.toUpperCase(),
      description: args.description,
      discountType: args.discountType,
      discountValue: args.discountValue,
      minOrderAmount: args.minOrderAmount,
      maxUsageCount: args.maxUsageCount,
      usedCount: 0,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      isActive: true,
      applicableProducts: args.applicableProducts,
      applicableCategories: args.applicableCategories,
    });
  },
});

// Validate and apply coupon
export const validateCoupon = query({
  args: {
    code: v.string(),
    orderAmount: v.number(),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    if (!coupon.isActive) {
      throw new Error("Coupon is not active");
    }

    const now = Date.now();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new Error("Coupon has expired or not yet valid");
    }

    if (coupon.minOrderAmount && args.orderAmount < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount is ৳${coupon.minOrderAmount}`);
    }

    if (coupon.maxUsageCount && coupon.usedCount >= coupon.maxUsageCount) {
      throw new Error("Coupon usage limit reached");
    }

    // Check if applicable to product
    if (args.productId) {
      if (coupon.applicableProducts && !coupon.applicableProducts.includes(args.productId)) {
        throw new Error("Coupon not applicable to this product");
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (args.orderAmount * coupon.discountValue) / 100;
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    return {
      valid: true,
      discount: Math.round(discount * 100) / 100,
      couponId: coupon._id,
    };
  },
});

// List coupons
export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let coupons = await ctx.db.query("coupons").collect();

    if (args.isActive !== undefined) {
      coupons = coupons.filter(c => c.isActive === args.isActive);
    }

    return coupons.sort((a, b) => b.validUntil - a.validUntil);
  },
});

// Use coupon (increment usage count)
export const useCoupon = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) throw new Error("Coupon not found");

    await ctx.db.patch(args.couponId, {
      usedCount: coupon.usedCount + 1,
    });
  },
});

// Deactivate coupon
export const deactivate = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) throw new Error("Coupon not found");

    await ctx.db.patch(args.couponId, { isActive: false });
  },
});
// Update coupon
export const update = mutation({
  args: {
    id: v.id("coupons"),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    discountType: v.optional(v.string()),
    discountValue: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const coupon = await ctx.db.get(args.id);
    if (!coupon) throw new Error("Coupon not found");

    const updateObj: any = {};
    if (args.code) updateObj.code = args.code.toUpperCase();
    if (args.description !== undefined) updateObj.description = args.description;
    if (args.discountType) updateObj.discountType = args.discountType;
    if (args.discountValue !== undefined) updateObj.discountValue = args.discountValue;
    if (args.minOrderAmount !== undefined) updateObj.minOrderAmount = args.minOrderAmount;
    if (args.maxUsageCount !== undefined) updateObj.maxUsageCount = args.maxUsageCount;
    if (args.validFrom !== undefined) updateObj.validFrom = args.validFrom;
    if (args.validUntil !== undefined) updateObj.validUntil = args.validUntil;
    if (args.isActive !== undefined) updateObj.isActive = args.isActive;

    await ctx.db.patch(args.id, updateObj);
    return args.id;
  },
});

// Delete coupon
export const delete_ = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const coupon = await ctx.db.get(args.id);
    if (!coupon) throw new Error("Coupon not found");

    await ctx.db.delete(args.id);
    return true;
  },
});