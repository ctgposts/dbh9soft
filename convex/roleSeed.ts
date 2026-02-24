import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Default roles to seed into the system
const DEFAULT_ROLES = [
  {
    roleName: "সুপার অ্যাডমিন",
    description: "সম্পূর্ণ সিস্টেম অ্যাক্সেস এবং নিয়ন্ত্রণ",
    permissions: [
      "user_management",
      "inventory_management",
      "sales_management",
      "customer_management",
      "reports_access",
      "settings_access",
      "outstanding_management",
      "hr_management",
      "analytics_access",
      "backup_access",
      "system_logs_access",
    ],
  },
  {
    roleName: "অ্যাডমিন",
    description: "প্রশাসনিক সমস্ত কাজের অ্যাক্সেস",
    permissions: [
      "user_management",
      "inventory_management",
      "sales_management",
      "customer_management",
      "reports_access",
      "settings_access",
      "outstanding_management",
      "hr_management",
    ],
  },
  {
    roleName: "মালিক",
    description: "ব্যবসায়িক মালিক - ব্যবসায়িক সিদ্ধান্ত এবং রিপোর্টিং অ্যাক্সেস",
    permissions: [
      "sales_management",
      "customer_management",
      "reports_access",
      "outstanding_management",
      "analytics_access",
      "hr_management",
    ],
  },
  {
    roleName: "ম্যানেজার",
    description: "বিভাগ পরিচালক - দল এবং বিক্রয় পরিচালনা",
    permissions: [
      "sales_management",
      "customer_management",
      "reports_access",
      "outstanding_management",
      "hr_management",
      "inventory_management",
    ],
  },
  {
    roleName: "সুপারভাইজর",
    description: "দল তত্ত্বাবধায়ক - স্টাফ তদারকি এবং বিক্রয় পর্যবেক্ষণ",
    permissions: [
      "sales_management",
      "customer_management",
      "reports_access",
      "inventory_management",
    ],
  },
  {
    roleName: "স্টাফ/বিক্রয় প্রতিনিধি",
    description: "সাধারণ বিক্রয় কর্মচারী - POS এবং গ্রাহক অ্যাক্সেস",
    permissions: ["sales_management", "customer_management", "inventory_management"],
  },
  {
    roleName: "গ্রাহক সেবা প্রতিনিধি",
    description: "গ্রাহক সেবা দল - গ্রাহক তথ্য এবং সমর্থন",
    permissions: ["customer_management", "reports_access", "outstanding_management"],
  },
  {
    roleName: "ক্যাশিয়ার/POS অপারেটর",
    description: "নগদ এবং পয়েন্ট অফ সেল অপারেশন",
    permissions: ["sales_management", "inventory_management"],
  },
  {
    roleName: "ইনভেন্টরি ম্যানেজার",
    description: "ইনভেন্টরি এবং স্টক পরিচালনা",
    permissions: ["inventory_management", "reports_access", "outstanding_management"],
  },
  {
    roleName: "HR/পেরোল অফিসার",
    description: "মানব সম্পদ এবং বেতন ব্যবস্থাপনা",
    permissions: ["hr_management", "reports_access"],
  },
  {
    roleName: "অডিটর",
    description: "শুধুমাত্র পড়া অ্যাক্সেস - অডিট এবং রিপোর্ট",
    permissions: ["reports_access", "analytics_access", "system_logs_access"],
  },
  {
    roleName: "আর্থিক অফিসার",
    description: "আর্থিক লেনদেন এবং রিপোর্টিং",
    permissions: [
      "sales_management",
      "customer_management",
      "reports_access",
      "outstanding_management",
      "analytics_access",
    ],
  },
];

/**
 * Seed default roles into the system
 * This should be called once during system initialization
 */
export const seedDefaultRoles = mutation({
  handler: async (ctx) => {
    const existingRoles = await ctx.db.query("userRoles").collect();
    
    // Only seed if there are no roles yet (first initialization)
    // This allows the system to be initialized without requiring admin login
    if (existingRoles.length > 0) {
      return {
        message: "সিস্টেম ইতিমধ্যে নিম্নলিখিত ভূমিকা দিয়ে সংজ্ঞায়িত হয়েছে",
        existingRoles: existingRoles.length,
        totalRoles: existingRoles.length,
      };
    }

    const createdRoles = [];

    for (const roleData of DEFAULT_ROLES) {
      // Check if role already exists
      const existing = existingRoles.find((r) => r.roleName === roleData.roleName);

      if (!existing) {
        const roleId = await ctx.db.insert("userRoles", {
          roleName: roleData.roleName,
          description: roleData.description,
          permissions: roleData.permissions,
          isActive: true,
          createdBy: undefined,
          createdByName: "System",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        createdRoles.push({
          roleId,
          roleName: roleData.roleName,
        });
      }
    }

    return {
      message: `${createdRoles.length} টি নতুন ভূমিকা সফলভাবে তৈরি হয়েছে`,
      createdRoles,
      totalRoles: existingRoles.length + createdRoles.length,
    };
  },
});

/**
 * Get all available permissions in the system
 */
export const getAvailablePermissions = mutation({
  handler: async (ctx) => {
    return {
      permissions: [
        {
          code: "user_management",
          name: "ব্যবহারকারী ব্যবস্থাপনা",
          description: "ব্যবহারকারী তৈরি, সম্পাদনা এবং মুছে ফেলা",
        },
        {
          code: "inventory_management",
          name: "ইনভেন্টরি ব্যবস্থাপনা",
          description: "পণ্য এবং স্টক পরিচালনা",
        },
        {
          code: "sales_management",
          name: "বিক্রয় ব্যবস্থাপনা",
          description: "বিক্রয় লেনদেন এবং POS অ্যাক্সেস",
        },
        {
          code: "customer_management",
          name: "গ্রাহক ব্যবস্থাপনা",
          description: "গ্রাহক তথ্য এবং অভিজ্ঞতা",
        },
        {
          code: "reports_access",
          name: "রিপোর্ট অ্যাক্সেস",
          description: "বিক্রয় এবং ব্যবসায়িক রিপোর্ট দেখা",
        },
        {
          code: "settings_access",
          name: "সেটিংস অ্যাক্সেস",
          description: "সিস্টেম এবং অ্যাপ্লিকেশন সেটিংস পরিবর্তন",
        },
        {
          code: "outstanding_management",
          name: "বকেয়া ব্যবস্থাপনা",
          description: "বকেয়া অর্থ এবং ক্রেডিট পরিচালনা",
        },
        {
          code: "hr_management",
          name: "HR ও পেরোল ব্যবস্থাপনা",
          description: "কর্মচারী, পেরোল এবং উপস্থিতি ব্যবস্থাপনা",
        },
        {
          code: "analytics_access",
          name: "বিশ্লেষণ অ্যাক্সেস",
          description: "ব্যবসায়িক বিশ্লেষণ এবং ড্যাশবোর্ড",
        },
        {
          code: "backup_access",
          name: "ব্যাকআপ অ্যাক্সেস",
          description: "ডেটা ব্যাকআপ এবং পুনরুদ্ধার",
        },
        {
          code: "system_logs_access",
          name: "সিস্টেম লগ অ্যাক্সেস",
          description: "সিস্টেম লগ এবং অডিট ট্রেইল দেখা",
        },
      ],
    };
  },
});
