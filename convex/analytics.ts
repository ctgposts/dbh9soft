import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Record analytics
export const recordAnalytics = mutation({
  args: {
    channel: v.string(),
    orderAmount: v.number(),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const existingMetrics = await ctx.db
      .query("orderAnalytics")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();

    const metricsForChannel = existingMetrics.find(m => m.channel === args.channel);

    // Get product details
    const productNames = await Promise.all(
      args.productIds.map(async (id) => {
        const product = await ctx.db.get(id);
        return { id, name: product?.name || "Unknown" };
      })
    );

    if (metricsForChannel) {
      // Update existing metrics
      await ctx.db.patch(metricsForChannel._id, {
        totalOrders: metricsForChannel.totalOrders + 1,
        totalRevenue: metricsForChannel.totalRevenue + args.orderAmount,
        averageOrderValue: (metricsForChannel.totalRevenue + args.orderAmount) / (metricsForChannel.totalOrders + 1),
        topProducts: metricsForChannel.topProducts.map(tp => ({
          ...tp,
          quantity: productNames.some(pn => pn.id === tp.productId) 
            ? tp.quantity + 1 
            : tp.quantity,
        })),
      });
    } else {
      // Create new metrics
      await ctx.db.insert("orderAnalytics", {
        date,
        channel: args.channel,
        totalOrders: 1,
        totalRevenue: args.orderAmount,
        averageOrderValue: args.orderAmount,
        topProducts: productNames.map(pn => ({
          productId: pn.id,
          productName: pn.name,
          quantity: 1,
          revenue: args.orderAmount / args.productIds.length,
        })),
      });
    }
  },
});

// Get analytics by date range
export const getAnalytics = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let analytics = await ctx.db.query("orderAnalytics").collect();

    // Filter by date range
    analytics = analytics.filter(a => {
      const date = new Date(a.date);
      const start = new Date(args.startDate);
      const end = new Date(args.endDate);
      return date >= start && date <= end;
    });

    if (args.channel) {
      analytics = analytics.filter(a => a.channel === args.channel);
    }

    return analytics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
});

// Get analytics summary
export const getSummary = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db.query("orderAnalytics").collect();

    const filtered = analytics.filter(a => {
      const date = new Date(a.date);
      const start = new Date(args.startDate);
      const end = new Date(args.endDate);
      return date >= start && date <= end;
    });

    const byChannel: Record<string, any> = {};
    let totalOrders = 0;
    let totalRevenue = 0;

    filtered.forEach(a => {
      if (!byChannel[a.channel]) {
        byChannel[a.channel] = {
          orders: 0,
          revenue: 0,
          avgOrder: 0,
        };
      }
      byChannel[a.channel].orders += a.totalOrders;
      byChannel[a.channel].revenue += a.totalRevenue;
      totalOrders += a.totalOrders;
      totalRevenue += a.totalRevenue;
    });

    // Calculate averages
    Object.keys(byChannel).forEach(channel => {
      byChannel[channel].avgOrder = byChannel[channel].revenue / byChannel[channel].orders;
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      byChannel,
    };
  },
});
