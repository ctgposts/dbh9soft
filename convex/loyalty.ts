import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ==================== LOYALTY PROGRAM MANAGEMENT ====================

// Get all loyalty programs
export const getAllPrograms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("loyaltyPrograms").collect();
  },
});

// Create loyalty program
export const createProgram = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    pointsPerDollar: v.number(),
    tiers: v.array(v.object({
      name: v.string(),
      minPoints: v.number(),
      discountPercentage: v.number(),
      bonusPointsMultiplier: v.number(),
      benefits: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("loyaltyPrograms", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// ==================== CUSTOMER LOYALTY ACCOUNT ====================

// Initialize customer loyalty account
export const initializeLoyaltyAccount = mutation({
  args: {
    customerId: v.id("customers"),
    customerName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if account already exists
    const existing = await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .first();

    if (existing) {
      return existing;
    }

    // Generate referral code
    const referralCode = `REF-${args.customerId.substring(0, 6)}-${Date.now().toString(36).toUpperCase()}`;

    return await ctx.db.insert("customerLoyalty", {
      customerId: args.customerId,
      customerName: args.customerName,
      email: args.email,
      phone: args.phone,
      totalPoints: 0,
      availablePoints: 0,
      redeemedPoints: 0,
      currentTier: "Bronze",
      membershipDate: Date.now(),
      lastActivityDate: Date.now(),
      totalSpent: 0,
      totalOrders: 0,
      birthDate: args.birthDate,
      referralCode,
      referredCustomers: [],
      isActive: true,
    });
  },
});

// Get customer loyalty account
export const getCustomerLoyalty = query({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .first();
  },
});

// Update loyalty account after purchase
export const addPointsForPurchase = mutation({
  args: {
    customerId: v.id("customers"),
    purchaseAmount: v.number(),
    saleId: v.optional(v.id("sales")),
    branchId: v.optional(v.id("branches")),
    branchName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get loyalty program
    const program = await ctx.db.query("loyaltyPrograms").first();
    if (!program) throw new Error("No loyalty program configured");

    // Get customer loyalty account
    let loyalty = await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .first();

    if (!loyalty) {
      const customer = await ctx.db.get(args.customerId);
      if (!customer) throw new Error("Customer not found");

      const newLoyalty = await ctx.db.insert("customerLoyalty", {
        customerId: args.customerId,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalPoints: 0,
        availablePoints: 0,
        redeemedPoints: 0,
        currentTier: "Bronze",
        membershipDate: Date.now(),
        lastActivityDate: Date.now(),
        totalSpent: 0,
        totalOrders: 0,
        referralCode: `REF-${args.customerId.substring(0, 6)}-${Date.now().toString(36).toUpperCase()}`,
        referredCustomers: [],
        isActive: true,
      });
      
      loyalty = await ctx.db.get(newLoyalty);
    }

    if (!loyalty) throw new Error("Failed to initialize loyalty account");

    // Calculate points based on tier multiplier
    const tier = program.tiers.find((t) => t.minPoints <= loyalty!.totalPoints);
    const multiplier = tier?.bonusPointsMultiplier || 1;
    const pointsEarned = Math.floor(args.purchaseAmount * program.pointsPerDollar * multiplier);

    // Update loyalty account
    const newTotalPoints = loyalty.totalPoints + pointsEarned;
    const newTier = program.tiers.reduceRight(
      (prev, t) => (newTotalPoints >= t.minPoints ? t.name : prev),
      "Bronze"
    );

    await ctx.db.patch(loyalty._id, {
      totalPoints: newTotalPoints,
      availablePoints: loyalty.availablePoints + pointsEarned,
      currentTier: newTier,
      lastActivityDate: Date.now(),
      totalSpent: loyalty.totalSpent + args.purchaseAmount,
      totalOrders: loyalty.totalOrders + 1,
    });

    // Record transaction
    await ctx.db.insert("pointsTransactions", {
      customerId: args.customerId,
      customerName: loyalty.customerName,
      transactionType: "purchase",
      points: pointsEarned,
      description: `Purchase points - $${args.purchaseAmount}`,
      referenceId: args.saleId,
      branchId: args.branchId,
      branchName: args.branchName,
      createdAt: Date.now(),
      createdBy: userId,
    });

    return { success: true, pointsEarned, newTotalPoints, newTier };
  },
});

// Redeem loyalty points
export const redeemPoints = mutation({
  args: {
    customerId: v.id("customers"),
    pointsToRedeem: v.number(),
    reason: v.string(), // "discount", "free_product", "refund"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const loyalty = await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .first();

    if (!loyalty) throw new Error("Loyalty account not found");
    if (loyalty.availablePoints < args.pointsToRedeem) {
      throw new Error("Insufficient points for redemption");
    }

    // Update loyalty account
    await ctx.db.patch(loyalty._id, {
      availablePoints: loyalty.availablePoints - args.pointsToRedeem,
      redeemedPoints: loyalty.redeemedPoints + args.pointsToRedeem,
      lastActivityDate: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("pointsTransactions", {
      customerId: args.customerId,
      customerName: loyalty.customerName,
      transactionType: "redemption",
      points: -args.pointsToRedeem,
      description: `Points redeemed - ${args.reason}`,
      branchId: undefined,
      createdAt: Date.now(),
      createdBy: userId,
    });

    return { success: true, remainingPoints: loyalty.availablePoints - args.pointsToRedeem };
  },
});

// Get points transactions for customer
export const getPointsTransactions = query({
  args: {
    customerId: v.id("customers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("pointsTransactions")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(limit);
  },
});

// ==================== COUPON MANAGEMENT ====================

// Create advanced coupon
export const createAdvancedCoupon = mutation({
  args: {
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.string(),
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    usagePerCustomer: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.number(),
    applicableProducts: v.optional(v.array(v.id("products"))),
    applicableCategories: v.optional(v.array(v.id("categories"))),
    applicableBranches: v.optional(v.array(v.id("branches"))),
    loyaltyTiersRequired: v.optional(v.array(v.string())),
    requiresLoyaltyPoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check if coupon code already exists
    const existing = await ctx.db
      .query("advancedCoupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("Coupon code already exists");
    }

    return await ctx.db.insert("advancedCoupons", {
      ...args,
      code: args.code.toUpperCase(),
      isActive: true,
      usageCount: 0,
      createdBy: userId,
      createdByName: user.name || "Unknown",
      createdAt: Date.now(),
      usedBy: [],
    });
  },
});

// Get all coupons
export const getAllCoupons = query({
  args: {
    status: v.optional(v.string()), // "active", "expired", "upcoming"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let coupons = await ctx.db.query("advancedCoupons").collect();

    if (args.status === "active") {
      coupons = coupons.filter((c) => c.isActive && c.validFrom <= now && c.validUntil >= now);
    } else if (args.status === "expired") {
      coupons = coupons.filter((c) => c.validUntil < now);
    } else if (args.status === "upcoming") {
      coupons = coupons.filter((c) => c.validFrom > now);
    }

    return coupons;
  },
});

// Validate coupon for customer
export const validateCouponForCustomer = query({
  args: {
    code: v.string(),
    customerId: v.id("customers"),
    orderAmount: v.number(),
    productIds: v.optional(v.array(v.id("products"))),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("advancedCoupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!coupon) {
      return { valid: false, reason: "Coupon not found" };
    }

    if (!coupon.isActive) {
      return { valid: false, reason: "Coupon is not active" };
    }

    const now = Date.now();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { valid: false, reason: "Coupon has expired or not yet valid" };
    }

    if (coupon.minOrderAmount && args.orderAmount < coupon.minOrderAmount) {
      return {
        valid: false,
        reason: `Minimum order amount is $${coupon.minOrderAmount}`,
      };
    }

    // Check usage limit
    if (coupon.maxUsageCount && coupon.usageCount >= coupon.maxUsageCount) {
      return { valid: false, reason: "Coupon usage limit exceeded" };
    }

    // Check per-customer usage
    const customerUsage = coupon.usedBy.find((u) => u.customerId === args.customerId);
    const usagePerCustomer = coupon.usagePerCustomer || 1;
    if (customerUsage && customerUsage.usageCount >= usagePerCustomer) {
      return { valid: false, reason: `You can only use this coupon ${usagePerCustomer} time(s)` };
    }

    // Check loyalty tier requirement
    if (coupon.loyaltyTiersRequired && coupon.loyaltyTiersRequired.length > 0) {
      const loyalty = await ctx.db
        .query("customerLoyalty")
        .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
        .first();

      if (!loyalty || !coupon.loyaltyTiersRequired.includes(loyalty.currentTier)) {
        return {
          valid: false,
          reason: `This coupon is only for ${coupon.loyaltyTiersRequired.join(", ")} members`,
        };
      }

      if (coupon.requiresLoyaltyPoints && loyalty.availablePoints < coupon.requiresLoyaltyPoints) {
        return {
          valid: false,
          reason: `You need at least ${coupon.requiresLoyaltyPoints} loyalty points to use this coupon`,
        };
      }
    }

    // Check product applicability
    if (args.productIds && coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicable = args.productIds.some((pid) =>
        coupon.applicableProducts!.includes(pid)
      );
      if (!hasApplicable) {
        return { valid: false, reason: "Coupon not applicable to selected products" };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (args.orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "free_shipping") {
      discountAmount = 0; // Handled separately
    }

    return {
      valid: true,
      couponId: coupon._id,
      discountAmount,
      discountType: coupon.discountType,
    };
  },
});

// Apply coupon to sale
export const applyCoupon = mutation({
  args: {
    couponId: v.id("advancedCoupons"),
    customerId: v.id("customers"),
    saleId: v.optional(v.id("sales")),
    discountAmount: v.number(),
    branchId: v.id("branches"),
    branchName: v.string(),
    pointsToRedeem: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) throw new Error("Coupon not found");

    const loyalty = await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .first();

    if (!loyalty) throw new Error("Loyalty account not found");

    // Update coupon usage
    const userUsage = coupon.usedBy.find((u) => u.customerId === args.customerId);
    if (userUsage) {
      userUsage.usageCount += 1;
      userUsage.lastUsedAt = Date.now();
    } else {
      coupon.usedBy.push({
        customerId: args.customerId,
        customerName: loyalty.customerName,
        usageCount: 1,
        lastUsedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.couponId, {
      usageCount: coupon.usageCount + 1,
      usedBy: coupon.usedBy,
    });

    // Redeem points if applicable
    if (args.pointsToRedeem) {
      if (loyalty.availablePoints < args.pointsToRedeem) {
        throw new Error("Insufficient loyalty points");
      }

      await ctx.db.patch(loyalty._id, {
        availablePoints: loyalty.availablePoints - args.pointsToRedeem,
        redeemedPoints: loyalty.redeemedPoints + args.pointsToRedeem,
      });

      await ctx.db.insert("pointsTransactions", {
        customerId: args.customerId,
        customerName: loyalty.customerName,
        transactionType: "redemption",
        points: -args.pointsToRedeem,
        description: `Points redeemed with coupon ${coupon.code}`,
        branchId: args.branchId,
        createdAt: Date.now(),
        createdBy: userId,
      });
    }

    // Record redemption
    const redemption = await ctx.db.insert("couponRedemptions", {
      couponId: args.couponId,
      couponCode: coupon.code,
      customerId: args.customerId,
      customerName: loyalty.customerName,
      saleId: args.saleId,
      discountAmount: args.discountAmount,
      pointsRedeemed: args.pointsToRedeem,
      branchId: args.branchId,
      branchName: args.branchName,
      redeemedAt: Date.now(),
      employeeId: undefined,
    });

    return { success: true, redemptionId: redemption };
  },
});

// ==================== REFERRAL PROGRAM ====================

// Create referral
export const createReferral = mutation({
  args: {
    referrerId: v.id("customers"),
    referrerName: v.string(),
    referrerPhone: v.optional(v.string()),
    referredName: v.string(),
    referredPhone: v.optional(v.string()),
    bonusPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get referrer loyalty account
    const referrerLoyalty = await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", args.referrerId))
      .first();

    if (!referrerLoyalty) throw new Error("Referrer loyalty account not found");

    // Generate referral code
    const referralCode = `${referrerLoyalty.referralCode}-${Date.now().toString(36).toUpperCase()}`;

    return await ctx.db.insert("referralProgram", {
      referrerId: args.referrerId,
      referrerName: args.referrerName,
      referrerPhone: args.referrerPhone,
      referredCustomerId: undefined,
      referredName: args.referredName,
      referredPhone: args.referredPhone,
      referralCode,
      status: "pending",
      bonusPointsOffered: args.bonusPoints,
      bonusPointsAwarded: 0,
      referredAt: Date.now(),
    });
  },
});

// Complete referral when referred customer makes first purchase
export const completeReferral = mutation({
  args: {
    referralId: v.id("referralProgram"),
    referredCustomerId: v.id("customers"),
    firstPurchaseAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");

    // Get referrer loyalty
    const referrerLoyalty = await ctx.db
      .query("customerLoyalty")
      .withIndex("by_customer", (q) => q.eq("customerId", referral.referrerId))
      .first();

    if (!referrerLoyalty) throw new Error("Referrer loyalty account not found");

    // Update referral
    await ctx.db.patch(args.referralId, {
      referredCustomerId: args.referredCustomerId,
      status: "completed",
      completedAt: Date.now(),
      firstPurchaseAmount: args.firstPurchaseAmount,
    });

    // Award bonus points to referrer
    const bonusPoints = referral.bonusPointsOffered;
    await ctx.db.patch(referrerLoyalty._id, {
      totalPoints: referrerLoyalty.totalPoints + bonusPoints,
      availablePoints: referrerLoyalty.availablePoints + bonusPoints,
      referredCustomers: [...referrerLoyalty.referredCustomers, args.referredCustomerId],
    });

    // Record bonus transaction
    await ctx.db.insert("pointsTransactions", {
      customerId: referral.referrerId,
      customerName: referrerLoyalty.customerName,
      transactionType: "referral",
      points: bonusPoints,
      description: `Referral bonus for ${referral.referredName}`,
      createdAt: Date.now(),
      createdBy: userId,
    });

    return { success: true, bonusPointsAwarded: bonusPoints };
  },
});

// ==================== ANALYTICS & REPORTS ====================

// Get loyalty statistics
export const getLoyaltyStats = query({
  args: {},
  handler: async (ctx) => {
    const totalCustomers = await ctx.db.query("customerLoyalty").collect();
    const tierDistribution = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
    };

    let totalPoints = 0;
    let totalRedeemed = 0;

    for (const loyalty of totalCustomers) {
      tierDistribution[loyalty.currentTier as keyof typeof tierDistribution]++;
      totalPoints += loyalty.totalPoints;
      totalRedeemed += loyalty.redeemedPoints;
    }

    return {
      totalMembers: totalCustomers.length,
      tierDistribution,
      totalPointsIssued: totalPoints,
      totalPointsRedeemed: totalRedeemed,
      activeCoupons: await ctx.db.query("advancedCoupons").collect().then((c) => {
        const now = Date.now();
        return c.filter((coup) => coup.isActive && coup.validFrom <= now && coup.validUntil >= now)
          .length;
      }),
    };
  },
});

// Get top customers by loyalty points
export const getTopCustomers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const customers = await ctx.db.query("customerLoyalty").collect();
    return customers.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, limit);
  },
});
