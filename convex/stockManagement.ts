import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBranchInventory = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const products = await ctx.db.query("products").collect();

    // Get inventory for this branch
    const inventory = products.map((product: any) => {
      const branchStock = product.branchStock?.find(
        (bs: any) => bs.branchId === args.branchId
      );

      return {
        productId: product._id,
        productName: product.name,
        productCode: product.productCode,
        brand: product.brand,
        color: product.color,
        fabric: product.fabric,
        currentStock: branchStock?.currentStock || 0,
        minStockLevel: branchStock?.minStockLevel || 0,
        maxStockLevel: branchStock?.maxStockLevel || 0,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        status:
          branchStock && branchStock.currentStock < branchStock.minStockLevel
            ? "low"
            : "normal",
      };
    });

    return inventory.sort((a: any, b: any) =>
      a.productName.localeCompare(b.productName)
    );
  },
});

export const adjustStock = mutation({
  args: {
    productId: v.id("products"),
    branchId: v.id("branches"),
    quantity: v.number(),
    type: v.string(), // "add", "deduct", "adjustment"
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Find branch stock
    const branchStockIndex = product.branchStock.findIndex(
      (bs: any) => bs.branchId === args.branchId
    );

    if (branchStockIndex === -1) {
      throw new Error("Branch not found in product stock");
    }

    const updatedBranchStock = [...product.branchStock];
    let newQuantity = updatedBranchStock[branchStockIndex].currentStock;

    if (args.type === "add") {
      newQuantity += args.quantity;
    } else if (args.type === "deduct") {
      if (newQuantity < args.quantity) {
        throw new Error("Insufficient stock");
      }
      newQuantity -= args.quantity;
    } else if (args.type === "adjustment") {
      newQuantity = args.quantity;
    }

    updatedBranchStock[branchStockIndex] = {
      ...updatedBranchStock[branchStockIndex],
      currentStock: newQuantity,
    };

    // Update global stock
    const totalStock = updatedBranchStock.reduce(
      (sum: number, bs: any) => sum + bs.currentStock,
      0
    );

    await ctx.db.patch(args.productId, {
      branchStock: updatedBranchStock,
      currentStock: totalStock,
    });

    // Log transaction
    const branch = await ctx.db.get(args.branchId);

    await ctx.db.insert("inventoryTransactions", {
      productId: args.productId,
      productName: product.name,
      branchId: args.branchId,
      branchName: branch?.name || "Unknown",
      type: args.type,
      quantity: args.quantity,
      notes: args.reason,
      createdAt: Date.now(),
    });

    return args.productId;
  },
});

export const getLowStockItems = query({
  args: {
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const products = await ctx.db.query("products").collect();

    const lowStockItems = products
      .map((product: any) => {
        if (args.branchId) {
          const branchStock = product.branchStock?.find(
            (bs: any) => bs.branchId === args.branchId
          );
          if (
            branchStock &&
            branchStock.currentStock <= branchStock.minStockLevel
          ) {
            return {
              productId: product._id,
              productName: product.name,
              productCode: product.productCode,
              brand: product.brand,
              currentStock: branchStock.currentStock,
              minStockLevel: branchStock.minStockLevel,
              shortage: branchStock.minStockLevel - branchStock.currentStock,
              branchId: args.branchId,
            };
          }
          return null;
        } else {
          // Get low stock items across all branches
          const lowItems = product.branchStock
            ?.filter(
              (bs: any) =>
                bs.currentStock <= bs.minStockLevel
            )
            .map((bs: any) => ({
              productId: product._id,
              productName: product.name,
              productCode: product.productCode,
              brand: product.brand,
              currentStock: bs.currentStock,
              minStockLevel: bs.minStockLevel,
              shortage: bs.minStockLevel - bs.currentStock,
              branchId: bs.branchId,
              branchName: bs.branchName,
            })) || [];
          return lowItems;
        }
      })
      .flat()
      .filter((item: any) => item !== null);

    return lowStockItems;
  },
});

export const getInventoryValue = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const products = await ctx.db.query("products").collect();

    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalUnits = 0;

    products.forEach((product: any) => {
      const branchStock = product.branchStock?.find(
        (bs: any) => bs.branchId === args.branchId
      );

      if (branchStock) {
        const stock = branchStock.currentStock;
        totalUnits += stock;
        totalCostValue += stock * product.costPrice;
        totalRetailValue += stock * product.sellingPrice;
      }
    });

    return {
      totalUnits,
      totalCostValue,
      totalRetailValue,
      margin: totalRetailValue - totalCostValue,
      marginPercentage:
        totalRetailValue > 0
          ? ((totalRetailValue - totalCostValue) / totalRetailValue) * 100
          : 0,
    };
  },
});

export const getTransactionHistory = query({
  args: {
    branchId: v.optional(v.id("branches")),
    productId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const allTransactions = await ctx.db.query("inventoryTransactions").collect();

    let transactions = allTransactions;

    if (args.branchId) {
      transactions = transactions.filter(
        (t: any) => t.branchId === args.branchId
      );
    }

    // Filter by product if provided
    if (args.productId) {
      transactions = transactions.filter(
        (t: any) => t.productId === args.productId
      );
    }

    // Sort by date descending
    transactions.sort((a: any, b: any) => b.createdAt - a.createdAt);

    // Limit results
    if (args.limit) {
      transactions = transactions.slice(0, args.limit);
    }

    return transactions;
  },
});

export const setMinMaxLevels = mutation({
  args: {
    productId: v.id("products"),
    branchId: v.id("branches"),
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    if (args.minStockLevel > args.maxStockLevel) {
      throw new Error("Min stock level cannot be greater than max");
    }

    const updatedBranchStock = product.branchStock.map((bs: any) => {
      if (bs.branchId === args.branchId) {
        return {
          ...bs,
          minStockLevel: args.minStockLevel,
          maxStockLevel: args.maxStockLevel,
        };
      }
      return bs;
    });

    await ctx.db.patch(args.productId, {
      branchStock: updatedBranchStock,
    });

    return args.productId;
  },
});

export const getStockComparison = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const comparison = product.branchStock?.map((bs: any) => ({
      branchId: bs.branchId,
      branchName: bs.branchName || "Unknown",
      currentStock: bs.currentStock,
      minStockLevel: bs.minStockLevel,
      maxStockLevel: bs.maxStockLevel,
      available: bs.currentStock > 0,
      lowStock: bs.currentStock <= bs.minStockLevel,
      overstock: bs.currentStock > bs.maxStockLevel,
    }));

    return comparison;
  },
});
