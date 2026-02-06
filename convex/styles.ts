import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List all style numbers
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const styles = await ctx.db
      .query("styles")
      .collect();
    
    return styles.sort((a, b) => {
      // Sort by style number (DBH-0001, DBH-0002, etc.)
      const numA = parseInt(a.styleNumber.split("-")[1], 10);
      const numB = parseInt(b.styleNumber.split("-")[1], 10);
      return numA - numB;
    });
  },
});

/**
 * Get a specific style with all its products
 */
export const get = query({
  args: { styleId: v.id("styles") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const style = await ctx.db.get(args.styleId);
    if (!style) return null;
    
    // Fetch all products in this style
    const products = await Promise.all(
      style.productIds.map((productId: string) => ctx.db.get(productId as any))
    );
    
    return {
      ...style,
      products: products.filter((p) => p !== null),
    };
  },
});

/**
 * Get styles by category
 */
export const getByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("styles")
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .collect();
  },
});

/**
 * Get styles by fabric
 */
export const getByFabric = query({
  args: { fabric: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("styles")
      .filter((q) => q.eq(q.field("fabric"), args.fabric))
      .collect();
  },
});

/**
 * Get styles by price
 */
export const getByPrice = query({
  args: { sellingPrice: v.number() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("styles")
      .filter((q) => q.eq(q.field("sellingPrice"), args.sellingPrice))
      .collect();
  },
});

/**
 * Search styles by style number
 */
export const searchByNumber = query({
  args: { styleNumber: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const allStyles = await ctx.db.query("styles").collect();
    
    return allStyles.filter((style) =>
      style.styleNumber.includes(args.styleNumber.toUpperCase())
    );
  },
});

/**
 * Get style with all related products (for listing)
 */
export const getStyleWithProducts = query({
  args: { styleId: v.id("styles") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const style = await ctx.db.get(args.styleId);
    if (!style) return null;
    
    // Fetch all products in this style
    const products = await Promise.all(
      style.productIds.map((productId: string) => ctx.db.get(productId as any))
    );
    
    return {
      ...style,
      products: products.filter((p) => p !== null),
    };
  },
});
