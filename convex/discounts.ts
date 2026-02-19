import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let discounts = await ctx.db.query("discounts").collect();
    
    if (args.branchId) {
      discounts = discounts.filter(d => 
        !d.branchIds || d.branchIds.includes(args.branchId!)
      );
    }
    
    if (args.isActive !== undefined) {
      discounts = discounts.filter(d => d.isActive === args.isActive);
    }
    
    // Filter by current date
    const now = Date.now();
    discounts = discounts.filter(d => 
      d.startDate <= now && d.endDate >= now
    );
    
    return discounts;
  },
});

export const get = query({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // "percentage", "fixed_amount"
    value: v.number(),
    scope: v.string(), // "all_products", "category", "specific_products"
    categoryIds: v.optional(v.array(v.id("categories"))),
    productIds: v.optional(v.array(v.id("products"))),
    branchIds: v.optional(v.array(v.id("branches"))),
    startDate: v.number(),
    endDate: v.number(),
    usageLimit: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const discountId = await ctx.db.insert("discounts", {
      name: args.name,
      description: args.description,
      type: args.type,
      value: args.value,
      scope: args.scope,
      categoryIds: args.categoryIds,
      productIds: args.productIds,
      branchIds: args.branchIds,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      usageLimit: args.usageLimit,
      usageCount: 0,
      minPurchaseAmount: args.minPurchaseAmount,
      maxDiscountAmount: args.maxDiscountAmount,
      createdBy: userId,
      createdByName: user.name || user.email || "Unknown",
    });

    return discountId;
  },
});

export const update = mutation({
  args: {
    id: v.id("discounts"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    value: v.number(),
    scope: v.string(),
    categoryIds: v.optional(v.array(v.id("categories"))),
    productIds: v.optional(v.array(v.id("products"))),
    branchIds: v.optional(v.array(v.id("branches"))),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    usageLimit: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const applyDiscount = query({
  args: {
    discountId: v.id("discounts"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const discount = await ctx.db.get(args.discountId);
    if (!discount || !discount.isActive) {
      return null;
    }

    // Check if discount is valid for current date
    const now = Date.now();
    if (discount.startDate > now || discount.endDate < now) {
      return null;
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return null;
    }

    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // Check if discount applies to this product
    let applies = false;
    
    if (discount.scope === "all_products") {
      applies = true;
    } else if (discount.scope === "category" && discount.categoryIds) {
      applies = product.categoryId ? discount.categoryIds.includes(product.categoryId) : false;
    } else if (discount.scope === "specific_products" && discount.productIds) {
      applies = discount.productIds.includes(args.productId);
    }

    if (!applies) return null;

    const subtotal = args.unitPrice * args.quantity;

    // Check minimum purchase amount
    if (discount.minPurchaseAmount && subtotal < discount.minPurchaseAmount) {
      return null;
    }

    let discountAmount = 0;
    
    if (discount.type === "percentage") {
      discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === "fixed_amount") {
      discountAmount = discount.value;
    }

    // Apply maximum discount limit
    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      discountId: discount._id,
      discountName: discount.name,
      discountValue: discount.value,
      discountAmount,
      finalPrice: subtotal - discountAmount,
    };
  },
});

export const bulkPriceUpdate = mutation({
  args: {
    scope: v.string(), // "all_products", "category", "specific_products"
    categoryIds: v.optional(v.array(v.id("categories"))),
    productIds: v.optional(v.array(v.id("products"))),
    updateType: v.string(), // "increase", "decrease"
    valueType: v.string(), // "percentage", "fixed_amount"
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let products = await ctx.db.query("products").collect();

    // Filter products based on scope
    if (args.scope === "category" && args.categoryIds) {
      products = products.filter(p => 
        p.categoryId && args.categoryIds!.includes(p.categoryId)
      );
    } else if (args.scope === "specific_products" && args.productIds) {
      products = products.filter(p => args.productIds!.includes(p._id));
    }

    const updates = [];

    for (const product of products) {
      let newPrice = product.sellingPrice;

      if (args.valueType === "percentage") {
        const changeAmount = (product.sellingPrice * args.value) / 100;
        if (args.updateType === "increase") {
          newPrice = product.sellingPrice + changeAmount;
        } else {
          newPrice = product.sellingPrice - changeAmount;
        }
      } else if (args.valueType === "fixed_amount") {
        if (args.updateType === "increase") {
          newPrice = product.sellingPrice + args.value;
        } else {
          newPrice = product.sellingPrice - args.value;
        }
      }

      // Ensure price doesn't go below cost price
      if (newPrice < product.costPrice) {
        newPrice = product.costPrice;
      }

      if (newPrice !== product.sellingPrice) {
        updates.push(ctx.db.patch(product._id, { sellingPrice: newPrice }));
      }
    }

    await Promise.all(updates);
    return { updatedCount: updates.length };
  },
});

export const incrementUsage = mutation({
  args: { discountId: v.id("discounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const discount = await ctx.db.get(args.discountId);
    if (!discount) throw new Error("Discount not found");

    await ctx.db.patch(args.discountId, {
      usageCount: discount.usageCount + 1,
    });

    return args.discountId;
  },
});
