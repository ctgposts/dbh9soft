import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * পণ্য ছবি স্বীকৃতি API
 * ছবির ফিচার বিশ্লেষণ করে মিলিয়ে যায় এমন পণ্য খুঁজে বের করে
 */

/**
 * ছবি থেকে পণ্য শনাক্ত করুন
 */
export const recognizeProductFromImage = query({
  args: {
    imageFeatures: v.object({
      colors: v.array(v.string()),
      patterns: v.array(v.string()),
      style: v.string(),
      tags: v.array(v.string()),
    }),
    branchId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    try {
      // ডাটাবেস থেকে সব পণ্য পান
      const products = await ctx.db.query('products').collect();

      // বৈশিষ্ট্যের উপর ভিত্তি করে স্কোর গণনা করুন
      const scoredProducts = products.map((product: any) => {
        let score = 50; // বেস স্কোর

        // ক্যাটাগরি অনুযায়ী স্কোর (যদি থাকে)
        if (product.name) {
          const nameNormalized = product.name.toLowerCase();
          if (args.imageFeatures.tags.some(tag => 
            nameNormalized.includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes('আবায়া')
          )) {
            score += 20;
          }
        }

        // স্টাইল মিলান
        if (args.imageFeatures.style === 'abaya' && product.name?.includes('আবায়া')) {
          score += 15;
        }

        // ট্যাগ মিলান (পণ্যের নামে খুঁজুন)
        const tagMatches = args.imageFeatures.tags.filter((tag) =>
          product.name?.toLowerCase().includes(tag.toLowerCase())
        );
        score += (tagMatches.length || 0) * 5;

        return {
          ...product,
          matchScore: Math.min(score, 100),
        };
      });

      // স্কোর অনুসারে সাজান এবং শীর্ষ 5 ফেরত দিন
      const topMatches = scoredProducts
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 5);

      return {
        success: true,
        matches: topMatches,
        totalMatches: topMatches.length,
      };
    } catch (error) {
      console.error('পণ্য শনাক্তকরণ ত্রুটি:', error);
      return {
        success: false,
        matches: [],
        error: 'পণ্য শনাক্তকরণ ব্যর্থ',
      };
    }
  },
});

/**
 * নাম এবং বর্ণনা দ্বারা পণ্য অনুসন্ধান করুন
 */
export const searchProductsByName = query({
  args: {
    searchTerm: v.string(),
    branchId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    try {
      const products = await ctx.db
        .query('products')
        .collect();

      // নামে ফিল্টার করুন
      const filtered = products.filter((p: any) =>
        p.name?.toLowerCase().includes(args.searchTerm.toLowerCase())
      );

      return {
        success: true,
        products: filtered,
        count: filtered.length,
      };
    } catch (error) {
      console.error('নাম অনুসন্ধান ত্রুটি:', error);
      return {
        success: false,
        products: [],
        error: 'অনুসন্ধান ব্যর্থ',
      };
    }
  },
});

/**
 * বিভাগ অনুযায়ী পণ্য অনুসন্ধান করুন
 */
export const searchProductsByStyle = query({
  args: {
    style: v.string(),
    branchId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    try {
      const products = await ctx.db
        .query('products')
        .collect();

      // নামে বিভাগ খুঁজুন
      const filtered = products.filter((p: any) =>
        p.name?.toLowerCase().includes(args.style.toLowerCase())
      );

      return {
        success: true,
        products: filtered,
        count: filtered.length,
      };
    } catch (error) {
      console.error('বিভাগ অনুসন্ধান ত্রুটি:', error);
      return {
        success: false,
        products: [],
        error: 'অনুসন্ধান ব্যর্থ',
      };
    }
  },
});

/**
 * পণ্যের বিস্তারিত তথ্য পান
 */
export const getProductDetails = query({
  args: {
    productId: v.string(),
  },
  async handler(ctx, args) {
    try {
      // সব পণ্য পান এবং খুঁজুন (ID স্ট্রিং অনুযায়ী)
      const products = await ctx.db.query('products').collect();
      const product = products.find((p: any) => p._id?.toString() === args.productId || p._id === args.productId);

      if (!product) {
        return {
          success: false,
          product: null,
          error: 'পণ্য খুঁজে পাওয়া যায়নি',
        };
      }

      return {
        success: true,
        product: {
          ...product,
          reviewCount: 0,
          avgRating: 'কোনো রেটিং নেই',
        },
      };
    } catch (error) {
      console.error('পণ্য বিবরণ ত্রুটি:', error);
      return {
        success: false,
        product: null,
        error: 'বিবরণ লোড ব্যর্থ',
      };
    }
  },
});

/**
 * অনুরূপ পণ্য খুঁজুন
 */
export const findSimilarProducts = query({
  args: {
    productId: v.string(),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    try {
      const limit = args.limit || 5;
      const products = await ctx.db.query('products').collect();
      const mainProduct = products.find((p: any) => p._id?.toString() === args.productId || p._id === args.productId) as any;

      if (!mainProduct) {
        return {
          success: false,
          products: [],
          error: 'পণ্য খুঁজে পাওয়া যায়নি',
        };
      }

      // একই ধরনের পণ্য খুঁজুন (নামে)
      const baseCategory = mainProduct.name?.split(' ')[0] || '';
      
      const similar = products
        .filter((p: any) => {
          const sameCategory = p.name?.split(' ')[0] === baseCategory && p._id !== mainProduct._id;
          return sameCategory;
        })
        .map((p: any) => ({
          ...p,
          similarityScore: Math.random() * 30 + 60, // 60-90 স্কোর
        }))
        .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      return {
        success: true,
        products: similar,
        count: similar.length,
      };
    } catch (error) {
      console.error('অনুরূপ পণ্য ত্রুটি:', error);
      return {
        success: false,
        products: [],
        error: 'অনুসন্ধান ব্যর্থ',
      };
    }
  },
});

/**
 * পণ্য ছবি আপলোড লগ রাখুন (মক সংস্করণ)
 */
export const logProductImageUpload = mutation({
  args: {
    productId: v.string(),
    imageUrl: v.string(),
    staffId: v.string(),
    branchId: v.optional(v.string()),
    uploadedAt: v.number(),
  },
  async handler(ctx, args) {
    try {
      // মক লগ - বাস্তবে টেবিলে সংরক্ষণ করুন
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        logId,
      };
    } catch (error) {
      console.error('লগ রাখার ত্রুটি:', error);
      return {
        success: false,
        error: 'লগ সংরক্ষণ ব্যর্থ',
      };
    }
  },
});

/**
 * পণ্য ছবির আপলোড ইতিহাস পান (মক সংস্করণ)
 */
export const getProductImageHistory = query({
  args: {
    productId: v.string(),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    try {
      // মক ডেটা ফেরত দিন
      const mockHistory = [
        {
          _id: 'log-1',
          productId: args.productId,
          uploadedAt: new Date(Date.now() - 86400000),
          staffId: 'staff-1',
        },
        {
          _id: 'log-2',
          productId: args.productId,
          uploadedAt: new Date(Date.now() - 172800000),
          staffId: 'staff-2',
        },
      ];

      return {
        success: true,
        history: mockHistory.slice(0, args.limit || 10),
        count: Math.min(mockHistory.length, args.limit || 10),
      };
    } catch (error) {
      console.error('ইতিহাস প্রাপ্তি ত্রুটি:', error);
      return {
        success: false,
        history: [],
        error: 'ইতিহাস লোড ব্যর্থ',
      };
    }
  },
});
