import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get applicable discounts for a product
export const getApplicableDiscounts = query({
  args: {
    productId: v.id("products"),
    branchId: v.optional(v.id("branches")),
    subtotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    let discounts = await ctx.db.query("discounts").collect();

    // Filter by date
    const now = Date.now();
    discounts = discounts.filter(d => 
      d.isActive && d.startDate <= now && d.endDate >= now
    );

    // Filter by branch
    if (args.branchId) {
      const branchId = args.branchId;
      discounts = discounts.filter(d =>
        !d.branchIds || d.branchIds.length === 0 || d.branchIds.includes(branchId)
      );
    }

    // Filter by scope
    const applicableDiscounts = discounts.filter(d => {
      // Check if discount applies to this product
      if (d.scope === "all_products") {
        return true;
      }
      if (d.scope === "category" && d.categoryIds) {
        return product.categoryId ? d.categoryIds.includes(product.categoryId) : false;
      }
      if (d.scope === "specific_products" && d.productIds) {
        return d.productIds.includes(args.productId);
      }
      return false;
    });

    // Filter by minimum purchase amount if provided
    if (args.subtotal !== undefined) {
      return applicableDiscounts.filter(d =>
        !d.minPurchaseAmount || args.subtotal! >= d.minPurchaseAmount
      );
    }

    return applicableDiscounts;
  },
});

// Calculate discount amount for a cart
export const calculateCartDiscount = query({
  args: {
    discountId: v.id("discounts"),
    cartItems: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
    subtotal: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    const discount = await ctx.db.get(args.discountId);
    if (!discount || !discount.isActive) {
      return {
        isValid: false,
        reason: "Discount is not active",
        discountAmount: 0,
      };
    }

    // Check date validity
    const now = Date.now();
    if (discount.startDate > now || discount.endDate < now) {
      return {
        isValid: false,
        reason: "Discount is not valid for the current date",
        discountAmount: 0,
      };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return {
        isValid: false,
        reason: "Discount usage limit exceeded",
        discountAmount: 0,
      };
    }

    // Check minimum purchase amount
    if (discount.minPurchaseAmount && args.subtotal < discount.minPurchaseAmount) {
      return {
        isValid: false,
        reason: `Minimum purchase amount of ${discount.minPurchaseAmount} required`,
        discountAmount: 0,
      };
    }

    // Check if discount applies to all items
    if (discount.scope !== "all_products") {
      let applicableTotal = 0;

      for (const item of args.cartItems) {
        const product = await ctx.db.get(item.productId);
        if (!product) continue;

        let applies = false;

        if (discount.scope === "category" && discount.categoryIds) {
          applies = product.categoryId ? discount.categoryIds.includes(product.categoryId) : false;
        } else if (discount.scope === "specific_products" && discount.productIds) {
          applies = discount.productIds.includes(item.productId);
        }

        if (applies) {
          applicableTotal += item.quantity * item.unitPrice;
        }
      }

      if (applicableTotal === 0) {
        return {
          isValid: false,
          reason: "No items in cart are eligible for this discount",
          discountAmount: 0,
        };
      }

      // Apply discount to applicable items only
      let discountAmount = 0;
      if (discount.type === "percentage") {
        discountAmount = (applicableTotal * discount.value) / 100;
      } else if (discount.type === "fixed_amount") {
        discountAmount = discount.value;
      }

      if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }

      if (discountAmount > applicableTotal) {
        discountAmount = applicableTotal;
      }

      return {
        isValid: true,
        discountAmount,
        discountId: discount._id,
        discountName: discount.name,
        discountValue: discount.value,
        discountType: discount.type,
      };
    }

    // Apply discount to entire cart
    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = (args.subtotal * discount.value) / 100;
    } else if (discount.type === "fixed_amount") {
      discountAmount = discount.value;
    }

    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
    }

    if (discountAmount > args.subtotal) {
      discountAmount = args.subtotal;
    }

    return {
      isValid: true,
      discountAmount,
      discountId: discount._id,
      discountName: discount.name,
      discountValue: discount.value,
      discountType: discount.type,
    };
  },
});

// Apply discount (increment usage counter)
export const applyDiscount = mutation({
  args: {
    discountId: v.id("discounts"),
    saleId: v.optional(v.id("sales")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const discount = await ctx.db.get(args.discountId);
    if (!discount) throw new Error("Discount not found");

    // Check if usage limit would be exceeded
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new Error("Discount usage limit has been reached");
    }

    // Increment usage count
    await ctx.db.patch(args.discountId, {
      usageCount: (discount.usageCount || 0) + 1,
    });

    return {
      success: true,
      newUsageCount: (discount.usageCount || 0) + 1,
    };
  },
});

// Get discount statistics
export const getDiscountStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    let discounts = await ctx.db.query("discounts").collect();

    if (args.branchId) {
      const branchId = args.branchId;
      discounts = discounts.filter(d =>
        !d.branchIds || d.branchIds.length === 0 || d.branchIds.includes(branchId)
      );
    }

    const now = Date.now();
    const active = discounts.filter(d =>
      d.isActive && d.startDate <= now && d.endDate >= now
    );
    const expired = discounts.filter(d => d.endDate < now);
    const upcoming = discounts.filter(d => d.startDate > now);
    const inactive = discounts.filter(d => !d.isActive);

    const totalUsage = discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0);
    const avgUsagePerDiscount = discounts.length > 0 ? totalUsage / discounts.length : 0;

    return {
      total: discounts.length,
      active: active.length,
      expired: expired.length,
      upcoming: upcoming.length,
      inactive: inactive.length,
      totalUsage,
      avgUsagePerDiscount: Math.round(avgUsagePerDiscount),
    };
  },
});

// Get discounts by status
export const getDiscountsByStatus = query({
  args: {
    status: v.string(), // "active", "expired", "upcoming", "inactive"
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    let discounts = await ctx.db.query("discounts").collect();

    if (args.branchId) {
      const branchId = args.branchId;
      discounts = discounts.filter(d =>
        !d.branchIds || d.branchIds.length === 0 || d.branchIds.includes(branchId)
      );
    }

    const now = Date.now();

    if (args.status === "active") {
      discounts = discounts.filter(d =>
        d.isActive && d.startDate <= now && d.endDate >= now
      );
    } else if (args.status === "expired") {
      discounts = discounts.filter(d => d.endDate < now);
    } else if (args.status === "upcoming") {
      discounts = discounts.filter(d => d.startDate > now);
    } else if (args.status === "inactive") {
      discounts = discounts.filter(d => !d.isActive);
    }

    return discounts;
  },
});

// Toggle discount active status
export const toggleDiscountStatus = mutation({
  args: {
    discountId: v.id("discounts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.discountId, {
      isActive: args.isActive,
    });

    return args.discountId;
  },
});

// Apply discount to multiple products
export const applyDiscountToProducts = mutation({
  args: {
    productIds: v.array(v.id("products")),
    discountType: v.string(), // "percentage", "fixed_amount"
    discountValue: v.number(),
    duration: v.number(), // days
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const startDate = Date.now();
    const endDate = startDate + args.duration * 24 * 60 * 60 * 1000;

    const discountId = await ctx.db.insert("discounts", {
      name: `Flash Sale - ${new Date(startDate).toLocaleDateString()}`,
      type: args.discountType,
      value: args.discountValue,
      scope: "specific_products",
      productIds: args.productIds,
      startDate,
      endDate,
      isActive: true,
      usageCount: 0,
      createdBy: userId,
      createdByName: user.name || user.email || "Unknown",
    });

    return discountId;
  },
});

// Get best applicable discount for a cart
export const getBestDiscount = query({
  args: {
    cartItems: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
    subtotal: v.number(),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);

    let discounts = await ctx.db.query("discounts").collect();

    // Filter by date
    const now = Date.now();
    discounts = discounts.filter(d =>
      d.isActive && d.startDate <= now && d.endDate >= now
    );

    // Filter by usage limit
    discounts = discounts.filter(d =>
      !d.usageLimit || d.usageCount < d.usageLimit
    );

    // Filter by minimum purchase amount
    discounts = discounts.filter(d =>
      !d.minPurchaseAmount || args.subtotal >= d.minPurchaseAmount
    );

    // Filter by branch
    if (args.branchId) {
      const branchId = args.branchId;
      discounts = discounts.filter(d =>
        !d.branchIds || d.branchIds.length === 0 || d.branchIds.includes(branchId)
      );
    }

    if (discounts.length === 0) {
      return {
        found: false,
        discountAmount: 0,
      };
    }

    // Calculate discount for each applicable discount
    const applicableDiscounts = [];

    for (const discount of discounts) {
      let applicableTotal = args.subtotal;

      // Check scope
      if (discount.scope !== "all_products") {
        applicableTotal = 0;
        for (const item of args.cartItems) {
          const product = await ctx.db.get(item.productId);
          if (!product) continue;

          let applies = false;
          if (discount.scope === "category" && discount.categoryIds) {
            applies = product.categoryId ? discount.categoryIds.includes(product.categoryId) : false;
          } else if (discount.scope === "specific_products" && discount.productIds) {
            applies = discount.productIds.includes(item.productId);
          }

          if (applies) {
            applicableTotal += item.quantity * item.unitPrice;
          }
        }
      }

      if (applicableTotal === 0) continue;

      let discountAmount = 0;
      if (discount.type === "percentage") {
        discountAmount = (applicableTotal * discount.value) / 100;
      } else if (discount.type === "fixed_amount") {
        discountAmount = discount.value;
      }

      if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }

      if (discountAmount > applicableTotal) {
        discountAmount = applicableTotal;
      }

      applicableDiscounts.push({
        id: discount._id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount,
      });
    }

    if (applicableDiscounts.length === 0) {
      return {
        found: false,
        discountAmount: 0,
      };
    }

    // Return the discount with highest amount
    const best = applicableDiscounts.reduce((max, curr) =>
      curr.discountAmount > max.discountAmount ? curr : max
    );

    return {
      found: true,
      ...best,
    };
  },
});

// Reset discount usage (Admin only)
export const resetDiscountUsage = mutation({
  args: {
    discountId: v.id("discounts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check if user is admin
    if ((user as any).role !== "admin") {
      throw new Error("Only admins can reset discount usage");
    }

    await ctx.db.patch(args.discountId, {
      usageCount: 0,
    });

    return args.discountId;
  },
});
