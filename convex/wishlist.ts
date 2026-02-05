import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Add to wishlist
export const addToWishlist = mutation({
  args: {
    productId: v.id("products"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Check if already in wishlist
    const existing = await ctx.db
      .query("wishlist")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();

    if (existing) {
      throw new Error("Product already in wishlist");
    }

    return await ctx.db.insert("wishlist", {
      userId: args.userId,
      productId: args.productId,
      addedAt: Date.now(),
    });
  },
});

// Remove from wishlist
export const removeFromWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("wishlist")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();

    if (item) {
      await ctx.db.delete(item._id);
    }
  },
});

// Get wishlist
export const getWishlist = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let wishlistItems = await ctx.db.query("wishlist").collect();

    if (args.userId) {
      wishlistItems = wishlistItems.filter(w => w.userId === args.userId);
    }

    // Get product details
    const itemsWithProducts = await Promise.all(
      wishlistItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      })
    );

    return itemsWithProducts
      .filter(item => item.product !== null)
      .sort((a, b) => b.addedAt - a.addedAt);
  },
});

// Check if product is in wishlist
export const isInWishlist = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("wishlist")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();

    return !!item;
  },
});
