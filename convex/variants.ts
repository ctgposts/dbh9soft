import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all variants for a specific product
 */
export const getProductVariants = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    
    return variants.filter(v => v.isActive);
  },
});

/**
 * Get a specific variant by barcode
 */
export const getVariantByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_barcode", (q) => q.eq("variantBarcode", args.barcode))
      .first();
    
    return variants || null;
  },
});

/**
 * Create a new variant for a product
 */
export const createVariant = mutation({
  args: {
    productId: v.id("products"),
    productName: v.string(),
    color: v.string(),
    sizes: v.array(v.string()),
    currentStock: v.number(),
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
    variantCode: v.string(),
    variantBarcode: v.string(),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Validate inputs
    if (!args.color?.trim()) {
      throw new Error("Color is required");
    }
    
    if (args.sizes.length === 0) {
      throw new Error("At least one size is required");
    }
    
    if (args.currentStock < 0) {
      throw new Error("Stock cannot be negative");
    }
    
    if (args.minStockLevel < 0) {
      throw new Error("Min stock level cannot be negative");
    }
    
    if (args.minStockLevel > args.maxStockLevel) {
      throw new Error("Min stock cannot exceed max stock");
    }
    
    // Check for duplicate barcode
    const existingBarcode = await ctx.db
      .query("productVariants")
      .withIndex("by_barcode", (q) => q.eq("variantBarcode", args.variantBarcode))
      .first();
    
    if (existingBarcode) {
      throw new Error("Variant barcode already exists");
    }
    
    // Create variant
    const variantId = await ctx.db.insert("productVariants", {
      productId: args.productId,
      productName: args.productName,
      color: args.color.trim(),
      sizes: args.sizes,
      stock: {
        currentStock: args.currentStock,
        minStockLevel: args.minStockLevel,
        maxStockLevel: args.maxStockLevel,
      },
      variantCode: args.variantCode,
      variantBarcode: args.variantBarcode,
      price: args.price,
      isActive: true,
    });
    
    return variantId;
  },
});

/**
 * Update a variant
 */
export const updateVariant = mutation({
  args: {
    variantId: v.id("productVariants"),
    color: v.optional(v.string()),
    sizes: v.optional(v.array(v.string())),
    currentStock: v.optional(v.number()),
    minStockLevel: v.optional(v.number()),
    maxStockLevel: v.optional(v.number()),
    price: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const variant = await ctx.db.get(args.variantId);
    if (!variant) throw new Error("Variant not found");
    
    const updates: any = {};
    
    if (args.color !== undefined && args.color.trim()) {
      updates.color = args.color.trim();
    }
    
    if (args.sizes !== undefined && args.sizes.length > 0) {
      updates.sizes = args.sizes;
    }
    
    if (args.currentStock !== undefined) {
      if (args.currentStock < 0) throw new Error("Stock cannot be negative");
      updates.stock = { ...variant.stock, currentStock: args.currentStock };
    }
    
    if (args.minStockLevel !== undefined) {
      if (args.minStockLevel < 0) throw new Error("Min stock cannot be negative");
      updates.stock = { ...variant.stock, minStockLevel: args.minStockLevel };
    }
    
    if (args.maxStockLevel !== undefined) {
      if (args.maxStockLevel < 1) throw new Error("Max stock must be at least 1");
      updates.stock = { ...variant.stock, maxStockLevel: args.maxStockLevel };
    }
    
    if (args.price !== undefined) {
      updates.price = args.price;
    }
    
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }
    
    await ctx.db.patch(args.variantId, updates);
    return args.variantId;
  },
});

/**
 * Adjust stock for a variant
 */
export const adjustVariantStock = mutation({
  args: {
    variantId: v.id("productVariants"),
    quantity: v.number(), // Can be positive or negative
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const variant = await ctx.db.get(args.variantId);
    if (!variant) throw new Error("Variant not found");
    
    const newStock = variant.stock.currentStock + args.quantity;
    
    if (newStock < 0) {
      throw new Error("Insufficient stock for this adjustment");
    }
    
    await ctx.db.patch(args.variantId, {
      stock: {
        ...variant.stock,
        currentStock: newStock,
      },
    });
    
    return newStock;
  },
});

/**
 * Delete a variant
 */
export const deleteVariant = mutation({
  args: { variantId: v.id("productVariants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const variant = await ctx.db.get(args.variantId);
    if (!variant) throw new Error("Variant not found");
    
    // Instead of deleting, mark as inactive
    await ctx.db.patch(args.variantId, { isActive: false });
    
    return args.variantId;
  },
});

/**
 * Get all variants with low stock
 */
export const getLowStockVariants = query({
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const variants = await ctx.db.query("productVariants").collect();
    
    return variants.filter(v => 
      v.isActive && v.stock.currentStock <= v.stock.minStockLevel
    );
  },
});

/**
 * Get variant details with product info
 */
export const getVariantWithProduct = query({
  args: { variantId: v.id("productVariants") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const variant = await ctx.db.get(args.variantId);
    if (!variant) return null;
    
    const product = await ctx.db.get(variant.productId);
    
    return {
      variant,
      product,
    };
  },
});
