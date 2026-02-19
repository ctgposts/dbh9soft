import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// List of all collections to backup
const BACKUP_COLLECTIONS = [
  "branches",
  "employees",
  "discounts",
  "whatsappOrders",
  "onlineProducts",
  "onlineOrders",
  "categories",
  "products",
  "styles",
  "sales",
  "customers",
  "stockMovements",
  "transactions",
  "branchTransfers",
  "storeSettings",
  "customerReviews",
  "wishlist",
  "coupons",
  "orderNotifications",
  "returns",
  "orderAnalytics",
  "userRoles",
  "userRules",
  "ruleApplicationLog",
  "permissionTemplates",
  "loyaltyPrograms",
  "customerLoyalty",
  "pointsTransactions",
  "advancedCoupons",
  "couponRedemptions",
  "referralProgram",
  "suppliers"
] as const;

export const exportAllData = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const backupData: any = {
      timestamp: Date.now(),
      version: "2.0",
      store: "DUBAI BORKA HOUSE",
      dataCollections: {}
    };

    // Backup all collections
    for (const collection of BACKUP_COLLECTIONS) {
      try {
        const data = await ctx.db.query(collection as any).collect();
        backupData.dataCollections[collection] = data;
      } catch (error) {
        // Collection might not exist, skip it
        console.warn(`Failed to backup collection ${collection}`);
        backupData.dataCollections[collection] = [];
      }
    }

    return backupData;
  },
});

export const importAllData = mutation({
  args: {
    data: v.object({
      timestamp: v.optional(v.number()),
      version: v.optional(v.string()),
      store: v.optional(v.string()),
      dataCollections: v.optional(v.record(v.string(), v.array(v.any()))),
      // Legacy format support
      products: v.optional(v.array(v.any())),
      sales: v.optional(v.array(v.any())),
      customers: v.optional(v.array(v.any())),
      categories: v.optional(v.array(v.any()))
    })
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dataCollections = args.data.dataCollections || {};
    
    // Support legacy backup format
    if (args.data.products) {
      dataCollections["products"] = args.data.products;
    }
    if (args.data.sales) {
      dataCollections["sales"] = args.data.sales;
    }
    if (args.data.customers) {
      dataCollections["customers"] = args.data.customers;
    }
    if (args.data.categories) {
      dataCollections["categories"] = args.data.categories;
    }

    // Clear existing data for each collection
    for (const collection of BACKUP_COLLECTIONS) {
      try {
        const existingData = await ctx.db.query(collection as any).collect();
        for (const record of existingData) {
          await ctx.db.delete(record._id);
        }
      } catch (error) {
        console.warn(`Failed to clear collection ${collection}`);
      }
    }

    // Import data for each collection
    for (const [collectionName, collectionData] of Object.entries(dataCollections)) {
      if (Array.isArray(collectionData) && collectionData.length > 0) {
        try {
          for (const record of collectionData) {
            const { _id, _creationTime, ...recordData } = record;
            await ctx.db.insert(collectionName as any, recordData);
          }
        } catch (error) {
          console.warn(`Failed to import collection ${collectionName}:`, error);
        }
      }
    }

    return { 
      success: true, 
      message: "Data imported successfully",
      collectionsRestored: Object.keys(dataCollections).length
    };
  },
});

export const resetAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all data from all collections
    for (const collection of BACKUP_COLLECTIONS) {
      try {
        const allRecords = await ctx.db.query(collection as any).collect();
        for (const record of allRecords) {
          await ctx.db.delete(record._id);
        }
      } catch (error) {
        console.warn(`Failed to clear collection ${collection}`);
      }
    }

    // Create default categories
    const defaultCategories = [
      {
        name: "Casual Abayas",
        description: "Everyday wear abayas for casual occasions",
        color: "Blue",
        isActive: true
      },
      {
        name: "Formal Abayas",
        description: "Elegant abayas for formal events and occasions",
        color: "Black",
        isActive: true
      },
      {
        name: "Party Wear",
        description: "Stylish abayas for parties and celebrations",
        color: "Purple",
        isActive: true
      }
    ];

    for (const category of defaultCategories) {
      try {
        await ctx.db.insert("categories", category);
      } catch (error) {
        console.warn("Failed to create default category");
      }
    }

    return { 
      success: true, 
      message: "✅ Application reset to default state successfully",
      collectionsReset: BACKUP_COLLECTIONS.length,
      defaultCategoriesCreated: 3
    };
  },
});

// Get backup statistics
export const getBackupStats = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const stats: any = {
      totalCollections: 0,
      totalRecords: 0,
      collections: {}
    };

    for (const collection of BACKUP_COLLECTIONS) {
      try {
        const records = await ctx.db.query(collection as any).collect();
        stats.collections[collection] = records.length;
        stats.totalRecords += records.length;
        stats.totalCollections += 1;
      } catch (error) {
        stats.collections[collection] = 0;
      }
    }

    return stats;
  },
});
