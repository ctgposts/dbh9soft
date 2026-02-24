import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Phase 4 Advanced Analytics Module
 * Separate from existing analytics - handles staff portal metrics
 */

export interface Phase4StaffStats {
  staffId: string;
  staffName: string;
  branchId: string;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  compressionRatio: number;
  qualityScore: number;
  approvalRate: number;
  period: string;
  date: string;
}

export interface Phase4LeaderboardEntry {
  rank: number;
  staffId: string;
  staffName: string;
  branchId: string;
  value: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  score: number;
  badge?: string;
}

export interface Phase4DailyReportData {
  date: string;
  branchId: string;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  topPerformers: Array<{
    staffId: string;
    staffName: string;
    scans: number;
    uploads: number;
  }>;
  systemHealth: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

/**
 * Get staff statistics for Phase 4
 */
export const phase4GetStaffStats = query({
  args: {
    staffId: v.optional(v.string()),
    period: v.optional(v.number()), // days
    branchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || 30;

    // TODO: Replace with actual database query
    // const stats = await ctx.db
    //   .query("staffProductStats")
    //   .withIndex("by_staffId_date", (q) => q.eq("staffId", args.staffId))
    //   .order("desc")
    //   .take(1)
    //   .collect();

    const mockStats: Phase4StaffStats = {
      staffId: args.staffId || "staff-001",
      staffName: "করিম আহমেদ",
      branchId: args.branchId || "branch-dhaka-01",
      totalScans: 145,
      totalUploads: 89,
      totalImages: 156,
      compressionRatio: 92.3,
      qualityScore: 8.7,
      approvalRate: 94.2,
      period: `${period} দিন`,
      date: new Date().toISOString(),
    };

    return mockStats;
  },
});

/**
 * Get leaderboard for Phase 4
 */
export const phase4GetLeaderboard = query({
  args: {
    category: v.union(
      v.literal("uploads"),
      v.literal("scans"),
      v.literal("compression"),
      v.literal("quality"),
      v.literal("engagement")
    ),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("all-time")
    ),
    limit: v.optional(v.number()),
    branchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // TODO: Replace with actual database query
    // const leaderboard = await ctx.db
    //   .query("staffLeaderboard")
    //   .withIndex("by_category_period", (q) =>
    //     q.eq("category", args.category).eq("period", args.period)
    //   )
    //   .take(limit)
    //   .collect();

    const mockLeaderboard: Phase4LeaderboardEntry[] = [
      {
        rank: 1,
        staffId: "staff-001",
        staffName: "করিম আহমেদ",
        branchId: args.branchId || "branch-dhaka",
        value: 234,
        trend: "up",
        trendPercentage: 12.5,
        score: 98,
        badge: "🏆",
      },
      {
        rank: 2,
        staffId: "staff-002",
        staffName: "ফাতিমা বেগম",
        branchId: args.branchId || "branch-dhaka",
        value: 198,
        trend: "up",
        trendPercentage: 8.2,
        score: 92,
        badge: "🥈",
      },
      {
        rank: 3,
        staffId: "staff-003",
        staffName: "রহিম হোসেন",
        branchId: args.branchId || "branch-dhaka",
        value: 175,
        trend: "stable",
        trendPercentage: 0,
        score: 87,
        badge: "🥉",
      },
      {
        rank: 4,
        staffId: "staff-004",
        staffName: "সালমা খান",
        branchId: args.branchId || "branch-dhaka",
        value: 162,
        trend: "down",
        trendPercentage: -3.1,
        score: 82,
      },
      {
        rank: 5,
        staffId: "staff-005",
        staffName: "করিম সরকার",
        branchId: args.branchId || "branch-dhaka",
        value: 148,
        trend: "up",
        trendPercentage: 5.4,
        score: 78,
      },
    ];

    return mockLeaderboard.slice(0, limit);
  },
});

/**
 * Get daily report for Phase 4
 */
export const phase4GetDailyReport = query({
  args: {
    branchId: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Replace with actual database aggregation
    // const report = await ctx.db
    //   .query("staffProductStats")
    //   .withIndex("by_date", (q) => q.eq("date", args.date || new Date().toISOString().split("T")[0]))
    //   .collect();

    const mockReport: Phase4DailyReportData = {
      date: args.date || new Date().toISOString().split("T")[0],
      branchId: args.branchId || "branch-dhaka-01",
      totalScans: 456,
      totalUploads: 234,
      totalImages: 567,
      topPerformers: [
        { staffId: "staff-001", staffName: "করিম আহমেদ", scans: 45, uploads: 28 },
        { staffId: "staff-002", staffName: "ফাতিমা বেগম", scans: 38, uploads: 24 },
        { staffId: "staff-003", staffName: "রহিম হোসেন", scans: 32, uploads: 21 },
      ],
      systemHealth: {
        avgResponseTime: 142,
        uptime: 99.98,
        errorRate: 0.02,
      },
    };

    return mockReport;
  },
});

/**
 * Get approval statistics for Phase 4
 */
export const phase4GetApprovalStats = query({
  args: {
    staffId: v.optional(v.string()),
    branchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Replace with actual database query
    // const approvals = await ctx.db
    //   .query("staffProductApprovals")
    //   .withIndex("by_staffId", (q) => q.eq("staffId", args.staffId))
    //   .collect();

    const mockApprovalStats = {
      staffId: args.staffId || "staff-001",
      staffName: "করিম আহমেদ",
      totalPending: 14,
      totalApproved: 142,
      totalRejected: 2,
      approvalRate: 97.2,
      averageApprovalTime: 2.3,
      recentApprovals: [
        {
          imageId: "img-001",
          approvedAt: new Date(Date.now() - 3600000).toISOString(),
          status: "approved",
        },
        {
          imageId: "img-002",
          approvedAt: new Date(Date.now() - 7200000).toISOString(),
          status: "approved",
        },
        {
          imageId: "img-003",
          approvedAt: new Date(Date.now() - 10800000).toISOString(),
          status: "rejected",
        },
      ],
    };

    return mockApprovalStats;
  },
});

/**
 * Get branch comparison data for Phase 4
 */
export const phase4GetBranchComparison = query({
  args: {
    metric: v.union(
      v.literal("scans"),
      v.literal("uploads"),
      v.literal("images"),
      v.literal("performance")
    ),
    period: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Mock branch comparison
    const mockComparisonData = [
      {
        branchId: "branch-dhaka-01",
        branchName: "ঢাকা-১",
        scans: 245,
        uploads: 134,
        images: 267,
        performance: 92.3,
        trend: "up" as const,
      },
      {
        branchId: "branch-dhaka-02",
        branchName: "ঢাকা-২",
        scans: 198,
        uploads: 108,
        images: 214,
        performance: 88.1,
        trend: "stable" as const,
      },
      {
        branchId: "branch-chittagong",
        branchName: "চট্টগ্রাম",
        scans: 156,
        uploads: 92,
        images: 178,
        performance: 85.4,
        trend: "down" as const,
      },
      {
        branchId: "branch-sylhet",
        branchName: "সিলেট",
        scans: 123,
        uploads: 71,
        images: 145,
        performance: 82.7,
        trend: "up" as const,
      },
    ];

    return mockComparisonData;
  },
});

/**
 * Get performance trends for Phase 4
 */
export const phase4GetPerformanceTrends = query({
  args: {
    staffId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const trendData = [];
    const baseDate = new Date();

    const dayNames = ["সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি", "রবি"];

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();

      trendData.unshift({
        date: date.toISOString().split("T")[0],
        dayName: dayNames[(dayOfWeek + 6) % 7],
        scans: Math.floor(Math.random() * 50) + 20,
        uploads: Math.floor(Math.random() * 30) + 10,
        images: Math.floor(Math.random() * 80) + 30,
        quality: Math.floor(Math.random() * 20) + 75,
      });
    }

    return trendData;
  },
});

/**
 * Log Phase 4 analytics event
 */
export const phase4LogEvent = mutation({
  args: {
    staffId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
    timestamp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Save to database
    // await ctx.db.insert("phase4Events", {
    //   staffId: args.staffId,
    //   eventType: args.eventType,
    //   eventData: args.eventData,
    //   timestamp: args.timestamp || new Date().toISOString(),
    // });

    const logEntry = {
      eventId: crypto.randomUUID(),
      staffId: args.staffId,
      eventType: args.eventType,
      eventData: args.eventData,
      timestamp: args.timestamp || new Date().toISOString(),
      logged: true,
    };

    console.log(`📊 Phase 4 Event logged:`, logEntry);

    return {
      success: true,
      eventId: logEntry.eventId,
    };
  },
});

/**
 * Generate performance report for Phase 4
 */
export const phase4GenerateReport = query({
  args: {
    staffId: v.optional(v.string()),
    branchId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const report = {
      reportId: `report-${Date.now()}`,
      staffId: args.staffId || "staff-001",
      staffName: "করিম আহমেদ",
      branchId: args.branchId || "branch-dhaka",
      period: {
        start: args.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: args.endDate || new Date().toISOString(),
      },
      summary: {
        totalScans: 456,
        totalUploads: 234,
        totalImages: 567,
        averageQuality: 8.6,
        approvalRate: 94.2,
        performanceScore: 91.5,
        improvementPercentage: 12.3,
      },
      metrics: [
        { name: "স্ক্যান", value: 456, target: 400, percentage: 114 },
        { name: "আপলোড", value: 234, target: 200, percentage: 117 },
        { name: "ছবি", value: 567, target: 500, percentage: 113 },
        { name: "গুণমান", value: 8.6, target: 8.0, percentage: 107 },
        { name: "অনুমোদন", value: 94.2, target: 90, percentage: 104 },
      ],
      recommendations: [
        "পরবর্তী মাসে আরও স্ক্যান লক্ষ্য করুন",
        "ছবির গুণমান বজায় রাখুন",
        "কর্মক্ষমতা বৃদ্ধি অব্যাহত রাখুন",
      ],
      generatedAt: new Date().toISOString(),
    };

    return report;
  },
});

/**
 * Get engagement metrics for Phase 4
 */
export const phase4GetEngagementMetrics = query({
  args: {
    branchId: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const metrics = {
      totalActiveStaff: 24,
      averageDailyScans: 156,
      averageDailyUploads: 89,
      peakHours: ["08:00-09:00", "11:00-12:00", "14:00-15:00"],
      engagementRate: 87.3,
      retention: 94.1,
      responseTime: {
        average: 142,
        min: 45,
        max: 312,
        unit: "ms",
      },
      topActivities: [
        { name: "স্ক্যানিং", count: 456, percentage: 45 },
        { name: "আপলোড", count: 234, percentage: 23 },
        { name: "পর্যালোচনা", count: 312, percentage: 31 },
      ],
    };

    return metrics;
  },
});
