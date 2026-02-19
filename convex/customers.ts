import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { 
    searchTerm: v.optional(v.string()),
    // NEW: Pagination parameters for performance optimization
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Default pagination: 20 items per page, max 100
    const limit = Math.min(args.limit || 20, 100);
    const offset = args.offset || 0;
    
    let customers = await ctx.db.query("customers").collect();
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(args.searchTerm!)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Get total count BEFORE pagination
    const totalCount = customers.length;
    
    // Apply pagination AFTER filtering
    customers = customers.slice(offset, offset + limit);
    
    // Return paginated results with metadata
    return {
      items: customers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
        pageNumber: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      }
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    preferredStyle: v.optional(v.string()),
    preferredSize: v.optional(v.string()),
    preferredColors: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    loyaltyPoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Validate required fields
    if (!args.name || args.name.trim().length < 2) {
      throw new Error("Customer name must be at least 2 characters long");
    }
    
    // At least one contact method required
    if (!args.email?.trim() && !args.phone?.trim()) {
      throw new Error("Either email or phone number is required");
    }
    
    // Normalize and validate email format if provided
    let normalizedEmail: string | undefined = undefined;
    if (args.email?.trim()) {
      normalizedEmail = args.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Check for duplicate email (normalized)
      const existingEmail = await ctx.db
        .query("customers")
        .filter((q) => q.eq(q.field("email"), normalizedEmail))
        .first();
      
      if (existingEmail) {
        throw new Error("A customer with this email already exists");
      }
    }
    
    // Normalize and validate phone format if provided
    let normalizedPhone: string | undefined = undefined;
    if (args.phone?.trim()) {
      // Remove spaces, dashes, and parentheses for normalization
      normalizedPhone = args.phone.trim().replace(/[\s\-()]/g, '');
      const phoneRegex = /^[\+]?[0-9]{10,20}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        throw new Error("Please enter a valid phone number");
      }
      
      // Check for duplicate phone (normalized)
      const existingPhone = await ctx.db
        .query("customers")
        .filter((q) => q.eq(q.field("phone"), normalizedPhone))
        .first();
      
      if (existingPhone) {
        throw new Error("A customer with this phone number already exists");
      }
    }
    
    const customerId = await ctx.db.insert("customers", {
      name: args.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      address: args.address?.trim(),
      city: args.city?.trim(),
      preferredStyle: args.preferredStyle?.trim(),
      preferredSize: args.preferredSize?.trim(),
      preferredColors: args.preferredColors || [],
      notes: args.notes?.trim(),
      totalPurchases: 0,
      loyaltyPoints: args.loyaltyPoints ?? 0,
      isActive: true,
    });

    // Create initial loyalty record for the new customer
    await ctx.db.insert("customerLoyalty", {
      customerId,
      customerName: args.name.trim(),
      email: args.email?.trim(),
      phone: args.phone?.trim(),
      currentTier: "Bronze",
      totalPoints: args.loyaltyPoints ?? 0,
      availablePoints: args.loyaltyPoints ?? 0,
      redeemedPoints: 0,
      totalSpent: 0,
      totalOrders: 0,
      referralCode: `${args.name.trim().replace(/\s+/g, '').toUpperCase()}-${customerId.substring(0, 6).toUpperCase()}`,
      membershipDate: Date.now(),
      lastActivityDate: Date.now(),
      referredCustomers: [],
      isActive: true,
    });

    return customerId;
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    preferredStyle: v.optional(v.string()),
    preferredSize: v.optional(v.string()),
    preferredColors: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    lastDeliveryAddress: v.optional(v.string()),
    lastDeliveryPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existingCustomer = await ctx.db.get(args.id);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }
    
    // Validate required fields
    if (!args.name || args.name.trim().length < 2) {
      throw new Error("Customer name must be at least 2 characters long");
    }
    
    // At least one contact method required
    if (!args.email?.trim() && !args.phone?.trim()) {
      throw new Error("Either email or phone number is required");
    }
    
    // Normalize and validate email format if provided
    let normalizedEmail: string | undefined = undefined;
    if (args.email?.trim()) {
      normalizedEmail = args.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Check for duplicate email (excluding current customer, normalized comparison)
      if (normalizedEmail !== existingCustomer.email?.toLowerCase()) {
        const duplicateEmail = await ctx.db
          .query("customers")
          .filter((q) => q.and(
            q.eq(q.field("email"), normalizedEmail),
            q.neq(q.field("_id"), args.id)
          ))
          .first();
        
        if (duplicateEmail) {
          throw new Error("A customer with this email already exists");
        }
      }
    }
    
    // Normalize and validate phone format if provided
    let normalizedPhone: string | undefined = undefined;
    if (args.phone?.trim()) {
      // Remove spaces, dashes, and parentheses for normalization
      normalizedPhone = args.phone.trim().replace(/[\s\-()]/g, '');
      const phoneRegex = /^[\+]?[0-9]{10,20}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        throw new Error("Please enter a valid phone number");
      }
      
      // Check for duplicate phone (excluding current customer, normalized comparison)
      if (normalizedPhone !== existingCustomer.phone?.replace(/[\s\-()]/g, '')) {
        const duplicatePhone = await ctx.db
          .query("customers")
          .filter((q) => q.and(
            q.eq(q.field("phone"), normalizedPhone),
            q.neq(q.field("_id"), args.id)
          ))
          .first();
        
        if (duplicatePhone) {
          throw new Error("A customer with this phone number already exists");
        }
      }
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      name: updates.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      address: updates.address?.trim(),
      city: updates.city?.trim(),
      preferredStyle: updates.preferredStyle?.trim(),
      preferredSize: updates.preferredSize?.trim(),
      preferredColors: updates.preferredColors || [],
      notes: updates.notes?.trim(),
      lastDeliveryAddress: updates.lastDeliveryAddress?.trim(),
      lastDeliveryPhone: updates.lastDeliveryPhone?.trim(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Check if customer has any sales
    const sales = await ctx.db
      .query("sales")
      .filter((q) => q.eq(q.field("customerId"), args.id))
      .first();
    
    if (sales) {
      throw new Error("Cannot delete customer with existing sales records");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});
