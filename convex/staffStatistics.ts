import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * স্টাফের দৈনিক পরিসংখ্যান পান
 */
export const getStaffDailyStats = query({
  args: {
    staffId: v.id("users"),
    date: v.optional(v.string()), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const today = args.date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${today}T00:00:00Z`).getTime();
    const endOfDay = new Date(`${today}T23:59:59Z`).getTime();

    // ইমেজ আপলোড কাউন্ট
    const uploadedImages = await ctx.db
      .query("staffProductImages")
      .filter((q) => q.eq(q.field("uploadedBy"), args.staffId))
      .collect();

    const todayUploads = uploadedImages.filter(
      (img) => img.uploadedAt >= startOfDay && img.uploadedAt <= endOfDay
    ).length;

    // স্ক্যান অ্যাক্টিভিটি
    const activities = await ctx.db
      .query("staffProductActivity")
      .filter((q) => q.eq(q.field("staffId"), args.staffId))
      .collect();

    const todayScans = activities.filter(
      (activity) => activity.timestamp >= startOfDay && activity.timestamp <= endOfDay && activity.action === "image_upload"
    ).length;

    // টোটাল আপলোড (সব সময়)
    const totalUploads = uploadedImages.length;

    // লাইক এবং রেটিং
    const totalLikes = uploadedImages.reduce((sum, img) => sum + (img.likes || 0), 0);

    return {
      staffId: args.staffId,
      date: today,
      todayUploads,
      todayScans,
      totalUploads,
      totalLikes,
      recentActivity: activities.slice(0, 10).reverse(),
      timestamp: Date.now(),
    };
  },
});

/**
 * ব্রাঞ্চের সামগ্রিক পরিসংখ্যান
 */
export const getBranchStats = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // সব ইমেজ
    const allImages = await ctx.db
      .query("staffProductImages")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    // সব অ্যাক্টিভিটি
    const allActivities = await ctx.db
      .query("staffProductActivity")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    // আজকের স্ট্যাটিস্টিক্স
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${today}T00:00:00Z`).getTime();
    const endOfDay = new Date(`${today}T23:59:59Z`).getTime();

    const todayImages = allImages.filter(
      (img) => img.uploadedAt >= startOfDay && img.uploadedAt <= endOfDay
    );

    const todayActivities = allActivities.filter(
      (activity) => activity.timestamp >= startOfDay && activity.timestamp <= endOfDay
    );

    // টপ স্টাফ (আজ)
    const staffUploadMap = new Map<string, number>();
    todayImages.forEach((img) => {
      const count = staffUploadMap.get(img.uploadedByName) || 0;
      staffUploadMap.set(img.uploadedByName, count + 1);
    });

    const topStaffToday = Array.from(staffUploadMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, uploads: count }));

    // মোট পরিসংখ্যান
    const totalImages = allImages.length;
    const totalActivities = allActivities.length;
    const totalLikes = allImages.reduce((sum, img) => sum + (img.likes || 0), 0);
    const approvedImages = allImages.filter((img) => img.isApproved).length;

    return {
      branchId: args.branchId,
      todayStats: {
        imagesUploaded: todayImages.length,
        activitiesLogged: todayActivities.length,
        topStaff: topStaffToday,
      },
      overallStats: {
        totalImages,
        totalActivities,
        totalLikes,
        approvedImages,
        pendingApproval: totalImages - approvedImages,
      },
      timestamp: Date.now(),
    };
  },
});

/**
 * লিডারবোর্ড ডেটা পান
 */
export const getStaffLeaderboard = query({
  args: {
    branchId: v.id("branches"),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("all")),
    category: v.union(v.literal("uploads"), v.literal("likes"), v.literal("approvals")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let startTime = now;

    // সময়কাল অনুযায়ী ফিল্টার করুন
    if (args.period === "daily") {
      startTime = now - 24 * 60 * 60 * 1000;
    } else if (args.period === "weekly") {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (args.period === "monthly") {
      startTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    const allImages = await ctx.db
      .query("staffProductImages")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    // সময়কাল অনুযায়ী ফিল্টার করুন
    const filteredImages =
      args.period === "all"
        ? allImages
        : allImages.filter((img) => img.uploadedAt >= startTime);

    // ক্যাটাগরি অনুযায়ী র‍্যাঙ্ক করুন
    const staffStats = new Map<string, { name: string; uploads: number; likes: number; approvals: number }>();

    filteredImages.forEach((img) => {
      const staffName = img.uploadedByName;
      if (!staffStats.has(staffName)) {
        staffStats.set(staffName, {
          name: staffName,
          uploads: 0,
          likes: 0,
          approvals: 0,
        });
      }

      const stat = staffStats.get(staffName)!;
      stat.uploads += 1;
      stat.likes += img.likes || 0;
      if (img.isApproved) stat.approvals += 1;
    });

    let leaderboard = Array.from(staffStats.values());

    // ক্যাটাগরি অনুযায়ী সাজান
    if (args.category === "uploads") {
      leaderboard.sort((a, b) => b.uploads - a.uploads);
    } else if (args.category === "likes") {
      leaderboard.sort((a, b) => b.likes - a.likes);
    } else if (args.category === "approvals") {
      leaderboard.sort((a, b) => b.approvals - a.approvals);
    }

    // র‍্যাঙ্ক যোগ করুন
    const rankedLeaderboard = leaderboard.map((staff, index) => ({
      rank: index + 1,
      ...staff,
    }));

    return {
      branchId: args.branchId,
      period: args.period,
      category: args.category,
      leaderboard: rankedLeaderboard,
      timestamp: Date.now(),
    };
  },
});

/**
 * স্টাফ পারফরম্যান্স সারমর্য পান
 */
export const getStaffPerformanceSummary = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const allImages = await ctx.db
      .query("staffProductImages")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const allActivities = await ctx.db
      .query("staffProductActivity")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    // স্টাফ প্রোফাইল তৈরি করুন
    const staffProfiles = new Map<string, any>();

    allImages.forEach((img) => {
      const staffName = img.uploadedByName;
      if (!staffProfiles.has(staffName)) {
        staffProfiles.set(staffName, {
          name: staffName,
          totalUploads: 0,
          totalLikes: 0,
          approvedImages: 0,
          pendingImages: 0,
          rating: 0,
          joinedDate: img.uploadedAt,
        });
      }

      const profile = staffProfiles.get(staffName);
      profile.totalUploads += 1;
      profile.totalLikes += img.likes || 0;
      if (img.isApproved) profile.approvedImages += 1;
      else profile.pendingImages += 1;
      profile.rating = profile.approvedImages > 0 ? (profile.totalLikes / profile.approvedImages) : 0;
    });

    const summaryList = Array.from(staffProfiles.values())
      .sort((a, b) => b.totalUploads - a.totalUploads);

    return {
      branchId: args.branchId,
      staffCount: staffProfiles.size,
      totalImages: allImages.length,
      totalActivities: allActivities.length,
      staffProfiles: summaryList,
      timestamp: Date.now(),
    };
  },
});

/**
 * সেটিংস ফিচার স্ট্যাটিস্টিক্স
 */
export const getFeatureUsageStats = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const allActivities = await ctx.db
      .query("staffProductActivity")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    // ফিচার ব্যবহার গণনা করুন
    const featureUsage = new Map<string, number>();

    allActivities.forEach((activity) => {
      const action = activity.action || "unknown";
      const count = featureUsage.get(action) || 0;
      featureUsage.set(action, count + 1);
    });

    const featureStats = Array.from(featureUsage.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count);

    return {
      branchId: args.branchId,
      featureUsage: featureStats,
      totalActivities: allActivities.length,
      timestamp: Date.now(),
    };
  },
});
