import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("storeSettings").first();
    return settings;
  },
});

export const getNotificationSounds = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("storeSettings").first();
    return settings?.notificationSounds || {
      enabled: true,
      masterVolume: 0.8,
      customSounds: {},
    };
  },
});

export const update = mutation({
  args: {
    storeName: v.optional(v.string()),
    storeTitle: v.optional(v.string()),
    logo: v.optional(v.string()),
    favicon: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    theme: v.optional(v.object({
      primaryColor: v.string(),
      secondaryColor: v.string(),
    })),
    contact: v.optional(v.object({
      phone: v.string(),
      email: v.string(),
      address: v.string(),
      website: v.optional(v.string()),
    })),
    clearLogo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate logo size (base64 strings can be large)
    if (args.logo && args.logo.length > 1500000) {
      throw new Error("Logo is too large. Please upload a smaller image.");
    }

    // Get existing settings
    const existingSettings = await ctx.db.query("storeSettings").first();

    // Prepare update object
    const updateObj: any = {
      lastUpdated: Date.now(),
      updatedBy: userId,
    };

    // Update fields if provided
    if (args.storeName !== undefined) updateObj.storeName = args.storeName;
    if (args.storeTitle !== undefined) updateObj.storeTitle = args.storeTitle;
    if (args.tagline !== undefined) updateObj.tagline = args.tagline;
    if (args.description !== undefined) updateObj.description = args.description;
    if (args.theme !== undefined) updateObj.theme = args.theme;
    if (args.contact !== undefined) updateObj.contact = args.contact;
    if (args.favicon !== undefined) updateObj.favicon = args.favicon;
    if (args.logo !== undefined) updateObj.logo = args.logo;
    
    // Handle explicit logo deletion
    if (args.clearLogo) {
      updateObj.logo = undefined;
    }

    if (existingSettings) {
      // Update existing record
      await ctx.db.patch(existingSettings._id, updateObj);
      console.log("✅ Updated settings:", { storeTitle: args.storeTitle, tagline: args.tagline, hasLogo: !!args.logo });
      return existingSettings._id;
    } else {
      // Create new record with defaults
      const newRecord = {
        storeName: args.storeName || "DUBAI BORKA HOUSE",
        storeTitle: args.storeTitle || "DUBAI BORKA HOUSE",
        tagline: args.tagline || "",
        description: args.description || "",
        logo: args.logo,
        favicon: args.favicon,
        theme: args.theme,
        contact: args.contact,
        lastUpdated: Date.now(),
        updatedBy: userId,
      };
      const id = await ctx.db.insert("storeSettings", newRecord);
      console.log("✅ Created new settings:", { storeTitle: args.storeTitle, tagline: args.tagline });
      return id;
    }
  },
});

// Update notification sound settings
export const updateNotificationSounds = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    masterVolume: v.optional(v.number()),
    customSounds: v.optional(v.object({
      sale_success: v.optional(v.string()),
      sale_complete: v.optional(v.string()),
      refund_approved: v.optional(v.string()),
      refund_rejected: v.optional(v.string()),
      payment_received: v.optional(v.string()),
      order_confirmed: v.optional(v.string()),
      task_completed: v.optional(v.string()),
      low_stock_warning: v.optional(v.string()),
      high_discount_alert: v.optional(v.string()),
      price_mismatch: v.optional(v.string()),
      inventory_alert: v.optional(v.string()),
      expiry_approaching: v.optional(v.string()),
      customer_limit_warning: v.optional(v.string()),
      payment_failed: v.optional(v.string()),
      system_error: v.optional(v.string()),
      critical_error: v.optional(v.string()),
      critical_inventory: v.optional(v.string()),
      transaction_error: v.optional(v.string()),
      customer_credit_exceeded: v.optional(v.string()),
      invalid_transaction: v.optional(v.string()),
      new_customer: v.optional(v.string()),
      large_order: v.optional(v.string()),
      bulk_order: v.optional(v.string()),
      bulk_sale: v.optional(v.string()),
      vip_customer_purchase: v.optional(v.string()),
      return_received: v.optional(v.string()),
      supplier_delivery: v.optional(v.string()),
      daily_target_reached: v.optional(v.string()),
      monthly_milestone: v.optional(v.string()),
      performance_boost: v.optional(v.string()),
      unusual_activity: v.optional(v.string()),
      system_check: v.optional(v.string()),
      backup_complete: v.optional(v.string()),
      countdown_timer: v.optional(v.string()),
      shift_change: v.optional(v.string()),
      employee_checkin: v.optional(v.string()),
      customer_alert: v.optional(v.string()),
      loyalty_earned: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingSettings = await ctx.db.query("storeSettings").first();

    if (!existingSettings) {
      throw new Error("Settings not found");
    }

    // Get current notification sounds or create new object
    const currentSounds = existingSettings.notificationSounds || {
      enabled: true,
      masterVolume: 0.8,
      customSounds: {},
    };

    // Merge with new values
    const updatedSounds: any = {
      enabled: args.enabled !== undefined ? args.enabled : currentSounds.enabled,
      masterVolume: args.masterVolume !== undefined ? args.masterVolume : currentSounds.masterVolume,
      customSounds: args.customSounds
        ? { ...currentSounds.customSounds, ...args.customSounds }
        : currentSounds.customSounds,
    };

    await ctx.db.patch(existingSettings._id, {
      notificationSounds: updatedSounds,
      lastUpdated: Date.now(),
      updatedBy: userId,
    });

    console.log("✅ Updated notification sounds");
    return updatedSounds;
  },
});

// Upload custom notification sound
export const uploadCustomSound = mutation({
  args: {
    soundType: v.string(),
    soundName: v.string(),
    soundData: v.string(),
    fileType: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate sound data size (max 2MB for audio)
    if (args.soundData.length > 2 * 1024 * 1024) {
      throw new Error("Sound file is too large. Maximum 2MB allowed.");
    }

    // Check if sound exists for this type and deactivate old ones
    const existingSounds = await ctx.db
      .query("notificationSoundLibrary")
      .filter((q) => q.eq(q.field("soundType"), args.soundType))
      .collect();

    // Deactivate previous sounds of this type
    for (const sound of existingSounds) {
      await ctx.db.patch(sound._id, { isActive: false });
    }

    // Insert new sound
    const soundId = await ctx.db.insert("notificationSoundLibrary", {
      soundType: args.soundType,
      soundName: args.soundName,
      soundData: args.soundData,
      fileType: args.fileType,
      duration: args.duration,
      uploadedBy: userId,
      uploadedByName: "User", // You can enhance this with actual user name
      uploadedAt: Date.now(),
      isActive: true,
    });

    console.log(`✅ Uploaded custom sound for ${args.soundType}`);
    return soundId;
  },
});

// Get custom sound by type
export const getCustomSound = query({
  args: {
    soundType: v.string(),
  },
  handler: async (ctx, args) => {
    const sound = await ctx.db
      .query("notificationSoundLibrary")
      .filter((q) => q.eq(q.field("soundType"), args.soundType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return sound || null;
  },
});

// Get all custom sounds
export const getAllCustomSounds = query({
  handler: async (ctx) => {
    const sounds = await ctx.db
      .query("notificationSoundLibrary")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return sounds;
  },
});
