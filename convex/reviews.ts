import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get reviews for a product
export const getProductReviews = query({
  args: {
    productId: v.id("products"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let reviews = await ctx.db
      .query("customerReviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    if (args.status) {
      reviews = reviews.filter(r => r.status === args.status);
    }

    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Submit a review
export const submitReview = mutation({
  args: {
    productId: v.id("products"),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    rating: v.number(),
    title: v.string(),
    review: v.string(),
    orderId: v.optional(v.id("sales")),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!args.title || args.title.length < 5) {
      throw new Error("Review title must be at least 5 characters");
    }

    if (!args.review || args.review.length < 20) {
      throw new Error("Review must be at least 20 characters");
    }

    const reviewId = await ctx.db.insert("customerReviews", {
      productId: args.productId,
      orderId: args.orderId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      rating: args.rating,
      title: args.title,
      review: args.review,
      verified: !!args.orderId,
      helpful: 0,
      createdAt: Date.now(),
      status: "pending", // Admin must approve
    });

    return reviewId;
  },
});

// Approve/reject review
export const approveReview = mutation({
  args: {
    reviewId: v.id("customerReviews"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    if (args.status !== "approved" && args.status !== "rejected") {
      throw new Error("Invalid status");
    }

    await ctx.db.patch(args.reviewId, { status: args.status });
  },
});

// Mark review as helpful
export const markHelpful = mutation({
  args: { reviewId: v.id("customerReviews") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(args.reviewId, {
      helpful: review.helpful + 1,
    });
  },
});

// Get average rating for product
export const getProductRating = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("customerReviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const approvedReviews = reviews.filter(r => r.status === "approved");
    
    if (approvedReviews.length === 0) {
      return { rating: 0, count: 0, breakdown: {} };
    }

    const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / approvedReviews.length;

    // Rating breakdown
    const breakdown = {
      5: approvedReviews.filter(r => r.rating === 5).length,
      4: approvedReviews.filter(r => r.rating === 4).length,
      3: approvedReviews.filter(r => r.rating === 3).length,
      2: approvedReviews.filter(r => r.rating === 2).length,
      1: approvedReviews.filter(r => r.rating === 1).length,
    };

    return {
      rating: Math.round(averageRating * 10) / 10,
      count: approvedReviews.length,
      breakdown,
    };
  },
});
