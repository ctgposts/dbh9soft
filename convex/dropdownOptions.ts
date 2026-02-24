import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ✅ Get all fabric options
export const getFabricOptions = query({
  args: {},
  handler: async (ctx) => {
    const options = await ctx.db.query("fabricOptions").order("asc").collect();
    return options.map(opt => opt.name).sort();
  },
});

// ✅ Get all embellishment options
export const getEmbellishmentOptions = query({
  args: {},
  handler: async (ctx) => {
    const options = await ctx.db.query("embellishmentOptions").order("asc").collect();
    return options.map(opt => opt.name).sort();
  },
});

// ✅ Add new fabric option
export const addFabricOption = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.trim();
    
    if (!normalizedName) {
      throw new Error("Fabric name cannot be empty");
    }

    // Check if already exists (case-insensitive)
    const existing = await ctx.db
      .query("fabricOptions")
      .filter(q => q.eq(q.field("nameLower"), normalizedName.toLowerCase()))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("fabricOptions", {
      name: normalizedName,
      nameLower: normalizedName.toLowerCase(),
      createdAt: Date.now(),
    });
  },
});

// ✅ Add new embellishment option
export const addEmbellishmentOption = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.trim();
    
    if (!normalizedName) {
      throw new Error("Embellishment name cannot be empty");
    }

    // Check if already exists (case-insensitive)
    const existing = await ctx.db
      .query("embellishmentOptions")
      .filter(q => q.eq(q.field("nameLower"), normalizedName.toLowerCase()))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("embellishmentOptions", {
      name: normalizedName,
      nameLower: normalizedName.toLowerCase(),
      createdAt: Date.now(),
    });
  },
});

// ✅ Add new category
export const addCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.trim();
    
    if (!normalizedName) {
      throw new Error("Category name cannot be empty");
    }

    // Check if already exists (case-insensitive)
    const allCategories = await ctx.db.query("categories").collect();
    const existing = allCategories.find(
      (cat: any) => cat.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("categories", {
      name: normalizedName,
      description: args.description,
      color: args.color,
      isActive: true,
    });
  },
});

// ✅ Get all categories
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").order("asc").collect();
  },
});
