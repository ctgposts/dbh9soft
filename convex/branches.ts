import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    return await ctx.db.query("branches").collect();
  },
});

export const get = query({
  args: { id: v.id("branches") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    address: v.string(),
    city: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
    managerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if branch code already exists
    const existingBranch = await ctx.db
      .query("branches")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existingBranch) {
      throw new Error("Branch code already exists");
    }

    const branchId = await ctx.db.insert("branches", {
      name: args.name,
      code: args.code,
      address: args.address,
      city: args.city,
      phone: args.phone,
      email: args.email,
      managerId: args.managerId,
      managerName: args.managerName,
      isActive: true,
      settings: {
        allowNegativeStock: false,
        autoReorderLevel: 5,
        taxRate: 0.05,
        currency: "BDT",
      },
    });

    return branchId;
  },
});

export const update = mutation({
  args: {
    id: v.id("branches"),
    name: v.string(),
    code: v.string(),
    address: v.string(),
    city: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
    managerName: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updateData } = args;

    // Check if branch code already exists (excluding current branch)
    const existingBranch = await ctx.db
      .query("branches")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existingBranch && existingBranch._id !== id) {
      throw new Error("Branch code already exists");
    }

    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("branches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if branch has any employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_branch", (q) => q.eq("branchId", args.id))
      .collect();

    if (employees.length > 0) {
      throw new Error("Cannot delete branch with existing employees");
    }

    // Check if branch has any sales
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_branch", (q) => q.eq("branchId", args.id))
      .collect();

    if (sales.length > 0) {
      throw new Error("Cannot delete branch with existing sales records");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getStats = query({
  args: { branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    if (args.branchId) {
      // Get stats for specific branch
      const sales = await ctx.db
        .query("sales")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId!))
        .collect();

      const employees = await ctx.db
        .query("employees")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId!))
        .collect();

      const products = await ctx.db.query("products").collect();
      const branchProducts = products.filter(p => 
        p.branchStock.some(bs => bs.branchId === args.branchId)
      );

      const totalRevenue = sales
        .filter(s => s.status === "completed")
        .reduce((sum, s) => sum + s.total, 0);

      const totalStock = branchProducts.reduce((sum, p) => {
        const branchStock = p.branchStock.find(bs => bs.branchId === args.branchId);
        return sum + (branchStock?.currentStock || 0);
      }, 0);

      return {
        totalSales: sales.length,
        totalRevenue,
        totalEmployees: employees.filter(e => e.isActive).length,
        totalProducts: branchProducts.length,
        totalStock,
        lowStockProducts: branchProducts.filter(p => {
          const branchStock = p.branchStock.find(bs => bs.branchId === args.branchId);
          return branchStock && branchStock.currentStock <= branchStock.minStockLevel;
        }).length,
      };
    } else {
      // Get overall stats
      const branches = await ctx.db.query("branches").collect();
      const sales = await ctx.db.query("sales").collect();
      const employees = await ctx.db.query("employees").collect();
      const products = await ctx.db.query("products").collect();

      const totalRevenue = sales
        .filter(s => s.status === "completed")
        .reduce((sum, s) => sum + s.total, 0);

      return {
        totalBranches: branches.filter(b => b.isActive).length,
        totalSales: sales.length,
        totalRevenue,
        totalEmployees: employees.filter(e => e.isActive).length,
        totalProducts: products.length,
      };
    }
  },
});
