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

// ✅ Seed default fabric and embellishment options (called once on app init)
export const seedDefaultOptions = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultFabrics = [
      "Crepe", "Chiffon", "Georgette", "Nida", "Jersey", "Silk", "Cotton",
      "Polyester", "ZOOM", "CEY", "ORGANJA", "POKA", "AROWA", "TICTOC",
      "PRINT", "BABLA", "BELVET", "LILEN", "KASMIRI", "FAKRU PRINT",
      "KORIYAN SIMAR", "JORI SHIPON"
    ];

    const defaultEmbellishments = [
      "Plain", "Embroidered", "Beaded", "Lace", "Sequined", "Stone Work",
      "HAND WORK", "ARI WORK", "CREP Work", "BeadSton", "LaceSton",
      "EmbroStone", "AriStone", "HandSton", "CrepStone", "SeqenStone",
      "StoneFbody", "StoneHbody", "Stonehand", "StoneBack", "AriHbody",
      "AriFBoday", "Arihand", "AriFront", "AriBack", "EmbroFBody",
      "EmbroHbody", "EmbroHand", "EmbroFront", "BelvetStone", "Belvet"
    ];

    // Check if already seeded
    const existingFabrics = await ctx.db.query("fabricOptions").collect();
    const existingEmbellishments = await ctx.db.query("embellishmentOptions").collect();

    let fabricsAdded = 0;
    let embellishmentsAdded = 0;

    // Add fabrics if not already present
    if (existingFabrics.length === 0) {
      for (const fabric of defaultFabrics) {
        await ctx.db.insert("fabricOptions", {
          name: fabric,
          nameLower: fabric.toLowerCase(),
          createdAt: Date.now(),
        });
        fabricsAdded++;
      }
    }

    // Add embellishments if not already present
    if (existingEmbellishments.length === 0) {
      for (const embellishment of defaultEmbellishments) {
        await ctx.db.insert("embellishmentOptions", {
          name: embellishment,
          nameLower: embellishment.toLowerCase(),
          createdAt: Date.now(),
        });
        embellishmentsAdded++;
      }
    }

    return {
      fabricsAdded,
      embellishmentsAdded,
      message: `Seeded ${fabricsAdded} fabrics and ${embellishmentsAdded} embellishments`,
    };
  },
});
