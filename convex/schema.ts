import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Branches/Locations/Showrooms
  branches: defineTable({
    name: v.string(),
    code: v.string(), // Unique branch code
    address: v.string(),
    city: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
    managerName: v.optional(v.string()),
    isActive: v.boolean(),
    settings: v.optional(v.object({
      allowNegativeStock: v.boolean(),
      autoReorderLevel: v.number(),
      taxRate: v.number(),
      currency: v.string(),
    })),
  })
    .index("by_code", ["code"])
    .index("by_city", ["city"]),

  // Employees
  employees: defineTable({
    employeeId: v.string(), // Unique employee ID
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    position: v.string(), // "Manager", "Cashier", "Sales Associate", "Stock Keeper"
    branchId: v.id("branches"),
    branchName: v.string(),
    salary: v.optional(v.number()),
    commissionRate: v.optional(v.number()), // Percentage
    permissions: v.array(v.string()), // ["pos", "inventory", "reports", "customers", "settings"]
    isActive: v.boolean(),
    hireDate: v.number(),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relation: v.string(),
    })),
  })
    .index("by_branch", ["branchId"])
    .index("by_employee_id", ["employeeId"])
    .index("by_position", ["position"]),

  // Discount Management
  discounts: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // "percentage", "fixed_amount"
    value: v.number(), // Percentage or fixed amount
    scope: v.string(), // "all_products", "category", "specific_products"
    categoryIds: v.optional(v.array(v.id("categories"))),
    productIds: v.optional(v.array(v.id("products"))),
    branchIds: v.optional(v.array(v.id("branches"))), // Which branches can use this discount
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    usageLimit: v.optional(v.number()), // Max number of times this discount can be used
    usageCount: v.number(), // Current usage count
    minPurchaseAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    createdBy: v.id("users"),
    createdByName: v.string(),
  })
    .index("by_branch", ["branchIds"])
    .index("by_category", ["categoryIds"])
    .index("by_active", ["isActive"])
    .index("by_date_range", ["startDate", "endDate"]),

  // WhatsApp Orders
  whatsappOrders: defineTable({
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    customerWhatsApp: v.string(),
    items: v.array(v.object({
      productId: v.optional(v.id("products")),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
      color: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    subtotal: v.number(),
    discount: v.number(),
    deliveryCharge: v.number(),
    total: v.number(),
    status: v.string(), // "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"
    branchId: v.id("branches"),
    branchName: v.string(),
    assignedTo: v.optional(v.id("employees")),
    assignedToName: v.optional(v.string()),
    deliveryAddress: v.optional(v.string()),
    deliveryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    whatsappMessageId: v.optional(v.string()),
  })
    .index("by_branch", ["branchId"])
    .index("by_status", ["status"])
    .index("by_customer_phone", ["customerPhone"])
    .index("by_assigned_to", ["assignedTo"]),

  // Online Store Products
  onlineProducts: defineTable({
    productId: v.id("products"),
    isOnline: v.boolean(),
    onlinePrice: v.optional(v.number()), // Different price for online
    onlineDiscount: v.optional(v.number()),
    onlineDescription: v.optional(v.string()),
    onlineImages: v.optional(v.array(v.string())),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featured: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_online", ["isOnline"])
    .index("by_featured", ["featured"]),

  // Online Orders
  onlineOrders: defineTable({
    orderNumber: v.string(),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
      color: v.optional(v.string()),
    })),
    subtotal: v.number(),
    discount: v.number(),
    shippingCharge: v.number(),
    tax: v.number(),
    total: v.number(),
    status: v.string(), // "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"
    paymentStatus: v.string(), // "pending", "paid", "failed", "refunded"
    paymentMethod: v.string(),
    shippingAddress: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      postalCode: v.optional(v.string()),
    }),
    branchId: v.id("branches"), // Which branch will fulfill this order
    branchName: v.string(),
    assignedTo: v.optional(v.id("employees")),
    trackingNumber: v.optional(v.string()),
    estimatedDelivery: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_branch", ["branchId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_customer", ["customerId"]),

  // Abaya Categories (Styles, Types)
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    isActive: v.boolean(),
  }),

  // Abaya Products
  products: defineTable({
    name: v.string(),
    brand: v.string(),
    model: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    
    // Abaya specific fields
    style: v.optional(v.string()), // "Traditional", "Modern", "Dubai Style", "Saudi Style", etc.
    fabric: v.string(), // "Crepe", "Chiffon", "Georgette", "Nida", "Jersey", etc.
    color: v.string(),
    sizes: v.array(v.string()), // ['50"', '52"', '54"', '56"', '58"', '60"', '62"']
    embellishments: v.optional(v.string()), // "Embroidered", "Beaded", "Lace", "Plain", etc.
    occasion: v.optional(v.string()), // "Daily Wear", "Party Wear", "Formal", "Casual", etc.
    
    // Pricing
    costPrice: v.number(),
    sellingPrice: v.number(),
    
    // Style Number (Auto-generated from Category + Fabric + Embellishments + Price)
    styleNumber: v.string(), // e.g., "A1", "A2", "B1" etc.
    
    // Product image and barcode
    pictureUrl: v.optional(v.string()),
    barcode: v.string(),
    productCode: v.string(),
    madeBy: v.optional(v.string()),
    
    // Stock location (BOX-1, BOX-2, etc.)
    stockLocation: v.optional(v.string()),
    
    // Stock management per branch
    branchStock: v.array(v.object({
      branchId: v.id("branches"),
      branchName: v.string(),
      currentStock: v.number(),
      minStockLevel: v.number(),
      maxStockLevel: v.number(),
    })),
    
    // Global stock (sum of all branches)
    currentStock: v.number(),
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
    
    // Product details
    description: v.optional(v.string()),
    
    // Status
    isActive: v.boolean(),
  })
    .index("by_category", ["categoryId"])
    .index("by_brand", ["brand"])
    .index("by_style", ["style"])
    .index("by_fabric", ["fabric"])
    .index("by_color", ["color"])
    .index("by_occasion", ["occasion"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["categoryId", "brand", "style", "fabric", "color", "occasion", "isActive"],
    }),

  // Sales
  sales: defineTable({
    saleNumber: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
      discountApplied: v.optional(v.object({
        discountId: v.id("discounts"),
        discountName: v.string(),
        discountValue: v.number(),
        discountAmount: v.number(),
      })),
    })),
    subtotal: v.number(),
    tax: v.number(),
    discount: v.number(),
    total: v.number(),
    paidAmount: v.number(),
    dueAmount: v.number(),
    paymentMethod: v.string(),
    paymentDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.string()),
    })),
    status: v.string(), // "completed", "partial", "pending", "cancelled", "returned"
    cashierId: v.id("users"),
    cashierName: v.string(),
    employeeId: v.optional(v.id("employees")),
    employeeName: v.optional(v.string()),
    deliveryInfo: v.optional(v.object({
      type: v.string(), // "pickup", "delivery"
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      charges: v.optional(v.number()),
    })),
  })
    .index("by_branch", ["branchId"])
    .index("by_customer", ["customerId"])
    .index("by_employee", ["employeeId"])
    .index("by_payment_method", ["paymentMethod"])
    .index("by_status", ["status"]),

  // Customers
  customers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    preferredBranchId: v.optional(v.id("branches")),
    preferredStyle: v.optional(v.string()), // "Traditional", "Modern", etc.
    preferredSize: v.optional(v.string()),
    preferredColors: v.optional(v.array(v.string())),
    totalPurchases: v.number(),
    lastPurchaseDate: v.optional(v.number()),
    lastDeliveryAddress: v.optional(v.string()), // ✅ For delivery auto-fill
    lastDeliveryPhone: v.optional(v.string()), // ✅ For delivery auto-fill
    loyaltyPoints: v.optional(v.number()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"])
    .index("by_branch", ["preferredBranchId"]),

  // Stock Movements
  stockMovements: defineTable({
    productId: v.id("products"),
    productName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    type: v.string(), // "in", "out", "transfer", "adjustment"
    quantity: v.number(),
    reason: v.string(), // "Sale", "Return", "Damage", "Adjustment", "Transfer"
    reference: v.optional(v.string()), // Sale number, transfer number
    fromBranchId: v.optional(v.id("branches")), // For transfers
    toBranchId: v.optional(v.id("branches")), // For transfers
    userId: v.id("users"),
    userName: v.string(),
    employeeId: v.optional(v.id("employees")),
    employeeName: v.optional(v.string()),
    previousStock: v.number(),
    newStock: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_branch", ["branchId"])
    .index("by_type", ["type"]),

  // Transactions (Mobile Banking, etc.)
  transactions: defineTable({
    transactionId: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    type: v.string(), // "sale", "expense", "payment"
    referenceId: v.optional(v.id("sales")),
    amount: v.number(),
    paymentMethod: v.string(),
    phoneNumber: v.optional(v.string()),
    status: v.string(), // "completed", "pending", "failed"
    details: v.optional(v.object({
      senderNumber: v.optional(v.string()),
      receiverNumber: v.optional(v.string()),
      fee: v.optional(v.number()),
      reference: v.optional(v.string()),
    })),
    userId: v.id("users"),
    employeeId: v.optional(v.id("employees")),
  })
    .index("by_branch", ["branchId"])
    .index("by_transaction_id", ["transactionId"])
    .index("by_type", ["type"])
    .index("by_payment_method", ["paymentMethod"]),

  // Branch Transfers
  branchTransfers: defineTable({
    transferNumber: v.string(),
    fromBranchId: v.id("branches"),
    fromBranchName: v.string(),
    toBranchId: v.id("branches"),
    toBranchName: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      unitCost: v.number(),
      totalCost: v.number(),
    })),
    totalItems: v.number(),
    totalCost: v.number(),
    status: v.string(), // "pending", "in_transit", "received", "cancelled"
    requestedBy: v.id("users"),
    requestedByName: v.string(),
    approvedBy: v.optional(v.id("users")),
    approvedByName: v.optional(v.string()),
    receivedBy: v.optional(v.id("users")),
    receivedByName: v.optional(v.string()),
    requestDate: v.number(),
    approvalDate: v.optional(v.number()),
    receivedDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_from_branch", ["fromBranchId"])
    .index("by_to_branch", ["toBranchId"])
    .index("by_status", ["status"]),

  // Store Settings
  storeSettings: defineTable({
    storeName: v.string(),
    storeTitle: v.string(),
    logo: v.optional(v.string()), // Base64 encoded logo or URL
    favicon: v.optional(v.string()), // Base64 encoded favicon
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
    // Notification Sound Settings
    notificationSounds: v.optional(v.object({
      enabled: v.boolean(),
      masterVolume: v.number(), // 0-1
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
    })),
    lastUpdated: v.number(),
    updatedBy: v.id("users"),
  }),

  // Notification Sounds Library (custom sound files)
  notificationSoundLibrary: defineTable({
    soundType: v.string(), // Notification type (e.g., "sale_success")
    soundName: v.string(), // Display name
    soundData: v.string(), // Base64 encoded audio file
    fileType: v.string(), // "audio/mp3", "audio/wav", "audio/ogg"
    duration: v.number(), // Duration in seconds
    uploadedBy: v.id("users"),
    uploadedByName: v.string(),
    uploadedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_sound_type", ["soundType"]),

  // Customer Reviews & Ratings
  customerReviews: defineTable({
    productId: v.id("products"),
    orderId: v.optional(v.id("sales")),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    rating: v.number(), // 1-5 stars
    title: v.string(),
    review: v.string(),
    verified: v.boolean(), // true if purchased
    helpful: v.number(), // helpful count
    createdAt: v.number(),
    status: v.string(), // "pending", "approved", "rejected"
  })
    .index("by_product", ["productId"])
    .index("by_order", ["orderId"]),

  // Wishlist for Online Store
  wishlist: defineTable({
    userId: v.optional(v.id("users")),
    customerId: v.optional(v.id("customers")),
    productId: v.id("products"),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"]),

  // Coupon/Promo Codes
  coupons: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.string(), // "percentage", "fixed"
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxUsageCount: v.optional(v.number()),
    usedCount: v.number(),
    validFrom: v.number(),
    validUntil: v.number(),
    isActive: v.boolean(),
    applicableProducts: v.optional(v.array(v.id("products"))),
    applicableCategories: v.optional(v.array(v.id("categories"))),
  })
    .index("by_code", ["code"]),

  // Order Notifications
  orderNotifications: defineTable({
    orderId: v.optional(v.id("sales")),
    whatsappOrderId: v.optional(v.id("whatsappOrders")),
    onlineOrderId: v.optional(v.id("onlineOrders")),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    notificationType: v.string(), // "email", "sms", "whatsapp"
    status: v.string(), // "pending", "sent", "failed"
    subject: v.optional(v.string()),
    message: v.string(),
    sentAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_whatsapp_order", ["whatsappOrderId"])
    .index("by_online_order", ["onlineOrderId"]),

  // Return & Exchange Requests
  returns: defineTable({
    orderNumber: v.string(),
    orderId: v.optional(v.id("sales")),
    whatsappOrderId: v.optional(v.id("whatsappOrders")),
    onlineOrderId: v.optional(v.id("onlineOrders")),
    customerId: v.optional(v.id("customers")),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      reason: v.string(),
      condition: v.string(), // "unopened", "used", "damaged"
    })),
    reason: v.string(),
    description: v.string(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    refundAmount: v.optional(v.number()),
    replacementOrderNumber: v.optional(v.string()),
    requestDate: v.number(),
    approvalDate: v.optional(v.number()),
    completionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_customer", ["customerId"]),

  // Order Analytics/Metrics
  orderAnalytics: defineTable({
    date: v.string(), // "YYYY-MM-DD"
    channel: v.string(), // "pos", "whatsapp", "online"
    totalOrders: v.number(),
    totalRevenue: v.number(),
    averageOrderValue: v.number(),
    topProducts: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      revenue: v.number(),
    })),
    conversionRate: v.optional(v.number()),
  })
    .index("by_date", ["date"])
    .index("by_channel", ["channel"]),

  // User Rules
  userRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    condition: v.string(), // JavaScript expression to evaluate
    action: v.string(), // Action to take if condition is true
    actionParams: v.optional(v.object({
      roleId: v.optional(v.id("userRoles")),
      roleName: v.optional(v.string()),
      permissions: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()),
    })),
    isActive: v.boolean(),
    priority: v.number(), // Higher priority rules execute first
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_priority", ["priority"]),

  // User Rule Applications Log
  ruleApplicationLog: defineTable({
    ruleId: v.id("userRules"),
    ruleName: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    applicationType: v.string(), // "auto", "manual", "scheduled"
    result: v.string(), // "success", "failed", "skipped"
    resultMessage: v.optional(v.string()),
    appliedAt: v.number(),
  })
    .index("by_rule", ["ruleId"])
    .index("by_user", ["userId"])
    .index("by_applied_at", ["appliedAt"]),

  // Permission Templates
  permissionTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    category: v.string(), // "sales", "inventory", "reports", "admin", "settings"
    createdAt: v.number(),
  })
    .index("by_category", ["category"]),

  // Loyalty Program & Tiers
  loyaltyPrograms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    pointsPerDollar: v.number(), // e.g., 1 point per $1 spent
    isActive: v.boolean(),
    tiers: v.array(v.object({
      name: v.string(), // "Bronze", "Silver", "Gold", "Platinum"
      minPoints: v.number(),
      discountPercentage: v.number(),
      bonusPointsMultiplier: v.number(), // e.g., 1.5x for higher tiers
      benefits: v.optional(v.array(v.string())), // Special benefits like free shipping, birthday bonus
    })),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"]),

  // Customer Loyalty Account
  customerLoyalty: defineTable({
    customerId: v.id("customers"),
    customerName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    totalPoints: v.number(),
    availablePoints: v.number(),
    redeemedPoints: v.number(),
    currentTier: v.string(), // "Bronze", "Silver", "Gold", "Platinum"
    tierUpgradeDate: v.optional(v.number()),
    membershipDate: v.number(),
    lastActivityDate: v.number(),
    totalSpent: v.number(),
    totalOrders: v.number(),
    birthDate: v.optional(v.number()),
    referralCode: v.string(),
    referredCustomers: v.array(v.string()), // Array of referred customer IDs
    isActive: v.boolean(),
  })
    .index("by_customer", ["customerId"])
    .index("by_tier", ["currentTier"])
    .index("by_referral", ["referralCode"]),

  // Loyalty Points Transactions
  pointsTransactions: defineTable({
    customerId: v.id("customers"),
    customerName: v.string(),
    transactionType: v.string(), // "purchase", "redemption", "bonus", "refund", "referral", "adjustment"
    points: v.number(),
    description: v.string(),
    referenceId: v.optional(v.id("sales")), // Link to sale if applicable
    branchId: v.optional(v.id("branches")),
    branchName: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_customer", ["customerId"])
    .index("by_type", ["transactionType"])
    .index("by_date", ["createdAt"]),

  // Enhanced Coupons with more features
  advancedCoupons: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.string(), // "percentage", "fixed", "points", "free_shipping"
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    usagePerCustomer: v.optional(v.number()), // Max uses per customer (default 1)
    maxUsageCount: v.optional(v.number()), // Total max uses globally
    usageCount: v.number(),
    validFrom: v.number(),
    validUntil: v.number(),
    isActive: v.boolean(),
    applicableProducts: v.optional(v.array(v.id("products"))),
    applicableCategories: v.optional(v.array(v.id("categories"))),
    applicableBranches: v.optional(v.array(v.id("branches"))),
    loyaltyTiersRequired: v.optional(v.array(v.string())), // e.g., ["Gold", "Platinum"]
    requiresLoyaltyPoints: v.optional(v.number()), // Minimum points to use
    createdBy: v.id("users"),
    createdByName: v.string(),
    createdAt: v.number(),
    usedBy: v.array(v.object({
      customerId: v.id("customers"),
      customerName: v.string(),
      usageCount: v.number(),
      lastUsedAt: v.number(),
    })),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_validity", ["validFrom", "validUntil"]),

  // Coupon Redemption History
  couponRedemptions: defineTable({
    couponId: v.id("advancedCoupons"),
    couponCode: v.string(),
    customerId: v.id("customers"),
    customerName: v.string(),
    saleId: v.optional(v.id("sales")),
    discountAmount: v.number(),
    pointsEarned: v.optional(v.number()),
    pointsRedeemed: v.optional(v.number()),
    branchId: v.id("branches"),
    branchName: v.string(),
    redeemedAt: v.number(),
    employeeId: v.optional(v.id("employees")),
    employeeName: v.optional(v.string()),
  })
    .index("by_coupon", ["couponId"])
    .index("by_customer", ["customerId"])
    .index("by_sale", ["saleId"])
    .index("by_date", ["redeemedAt"]),

  // Referral Program
  referralProgram: defineTable({
    referrerId: v.id("customers"),
    referrerName: v.string(),
    referrerPhone: v.optional(v.string()),
    referredCustomerId: v.optional(v.id("customers")),
    referredName: v.optional(v.string()),
    referredPhone: v.optional(v.string()),
    referralCode: v.string(),
    status: v.string(), // "pending", "completed", "cancelled"
    bonusPointsOffered: v.number(),
    bonusPointsAwarded: v.number(),
    referredAt: v.number(),
    completedAt: v.optional(v.number()),
    firstPurchaseAmount: v.optional(v.number()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_code", ["referralCode"])
    .index("by_status", ["status"]),

  // Stock Transfers
  stockTransfers: defineTable({
    transferNumber: v.string(),
    sourceBranchId: v.id("branches"),
    sourceBranchName: v.string(),
    destinationBranchId: v.id("branches"),
    destinationBranchName: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        currentStock: v.number(),
      })
    ),
    status: v.string(), // "pending", "approved", "in_transit", "completed", "cancelled"
    notes: v.optional(v.string()),
    requestedBy: v.string(),
    approvedBy: v.optional(v.string()),
    receivedBy: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_source_branch", ["sourceBranchId"])
    .index("by_destination_branch", ["destinationBranchId"])
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"]),

  // Inventory Transactions (Log)
  inventoryTransactions: defineTable({
    productId: v.id("products"),
    productName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    type: v.string(), // "stock_transfer_out", "stock_transfer_in", "add", "deduct", "adjustment", "sale", "return", "purchase"
    quantity: v.number(),
    notes: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_branch", ["branchId"])
    .index("by_product", ["productId"])
    .index("by_date", ["createdAt"])
    .index("by_type", ["type"]),

  // Outstanding Amount / Customer Receivables Management
  outstandingAmounts: defineTable({
    customerId: v.id("customers"),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    branchId: v.id("branches"),
    branchName: v.string(),
    saleIds: v.array(v.id("sales")), // Related sale IDs
    totalAmount: v.number(), // Total outstanding amount
    paidAmount: v.number(), // Total paid so far
    remainingAmount: v.number(), // Remaining balance
    outstandingDays: v.number(), // Days since first outstanding
    status: v.string(), // "active", "resolved", "overdue", "partial"
    dueDate: v.optional(v.number()), // Expected payment date
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
    lastModifiedBy: v.optional(v.id("users")),
  })
    .index("by_customer", ["customerId"])
    .index("by_branch", ["branchId"])
    .index("by_status", ["status"])
    .index("by_amount", ["remainingAmount"])
    .index("by_days", ["outstandingDays"]),

  // Payment Records for Outstanding Amounts
  outstandingPayments: defineTable({
    outstandingId: v.id("outstandingAmounts"),
    customerId: v.id("customers"),
    customerName: v.string(),
    saleId: v.optional(v.id("sales")),
    saleNumber: v.optional(v.string()),
    amount: v.number(), // Payment amount
    paymentMethod: v.string(), // "cash", "card", "bank_transfer", "mobile_banking", "cheque", "other"
    paymentDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      chequeNumber: v.optional(v.string()),
      bankName: v.optional(v.string()),
      reference: v.optional(v.string()),
    })),
    paymentDate: v.number(),
    notes: v.optional(v.string()),
    branchId: v.id("branches"),
    branchName: v.string(),
    recordedBy: v.optional(v.id("users")),
    recordedByName: v.string(),
  })
    .index("by_outstanding", ["outstandingId"])
    .index("by_customer", ["customerId"])
    .index("by_payment_date", ["paymentDate"])
    .index("by_payment_method", ["paymentMethod"]),

  // Payment Reminders for Outstanding Amounts
  paymentReminders: defineTable({
    outstandingId: v.id("outstandingAmounts"),
    customerId: v.id("customers"),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    remainingAmount: v.number(),
    reminderType: v.string(), // "sms", "email", "whatsapp", "call"
    reminderStatus: v.string(), // "pending", "sent", "failed", "acknowledged"
    message: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    scheduledFor: v.number(), // Date when to send reminder
    daysOverdue: v.number(),
    createdAt: v.number(),
    sentBy: v.optional(v.id("users")),
    failureReason: v.optional(v.string()),
  })
    .index("by_outstanding", ["outstandingId"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["reminderStatus"])
    .index("by_date", ["scheduledFor"]),

  // Outstanding Amount Aging Report
  outstandingAging: defineTable({
    customerId: v.id("customers"),
    customerName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    current: v.number(), // 0-30 days
    days30_60: v.number(), // 30-60 days
    days60_90: v.number(), // 60-90 days
    days90plus: v.number(), // 90+ days
    totalOutstanding: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_branch", ["branchId"]),

  // Collection History / Follow-ups
  collectionFollowups: defineTable({
    outstandingId: v.id("outstandingAmounts"),
    customerId: v.id("customers"),
    customerName: v.string(),
    followupType: v.string(), // "call", "sms", "email", "whatsapp", "visit", "note"
    description: v.string(),
    promiseAmount: v.optional(v.number()), // Amount customer promised to pay
    promiseDate: v.optional(v.number()), // When they promised to pay
    outcome: v.string(), // "promised", "partial_paid", "pending", "no_response", "refused"
    notes: v.optional(v.string()),
    nextFollowupDate: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    createdByName: v.string(),
  })
    .index("by_outstanding", ["outstandingId"])
    .index("by_customer", ["customerId"])
    .index("by_type", ["followupType"])
    .index("by_date", ["createdAt"]),

  // ============================================
  // HR & PAYROLL TABLES
  // ============================================

  // Employee Information
  hrEmployees: defineTable({
    employeeId: v.string(), // Unique ID like EMP-001
    firstName: v.string(),
    lastName: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.number(),
    gender: v.string(), // "male", "female", "other"
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    nationality: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    department: v.string(), // "Sales", "Operations", "HR", "Finance"
    designation: v.string(), // "Manager", "Executive", "Coordinator"
    reportingManagerId: v.optional(v.id("hrEmployees")),
    reportingManagerName: v.optional(v.string()),
    employmentType: v.string(), // "permanent", "contract", "temporary", "internship"
    joinDate: v.number(),
    confirmationDate: v.optional(v.number()),
    baseSalary: v.number(),
    grossSalary: v.number(),
    currency: v.string(), // "BDT", "USD", "INR"
    bankAccountNumber: v.optional(v.string()),
    bankName: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    emergencyContactRelation: v.string(),
    panNumber: v.optional(v.string()),
    aadharNumber: v.optional(v.string()),
    epfNumber: v.optional(v.string()),
    esiNumber: v.optional(v.string()),
    status: v.string(), // "active", "inactive", "on_leave", "terminated"
    terminationDate: v.optional(v.number()),
    terminationReason: v.optional(v.string()),
  })
    .index("by_employee_id", ["employeeId"])
    .index("by_branch", ["branchId"])
    .index("by_department", ["department"])
    .index("by_status", ["status"]),

  // Attendance Tracking
  hrAttendance: defineTable({
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    attendanceDate: v.number(),
    status: v.string(), // "present", "absent", "half_day", "leave", "sick_leave", "on_duty"
    checkInTime: v.optional(v.number()),
    checkOutTime: v.optional(v.number()),
    workingHours: v.optional(v.number()),
    notes: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    approvedByName: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_date", ["attendanceDate"])
    .index("by_branch", ["branchId"]),

  // Leave Management
  hrLeaves: defineTable({
    leaveRequestId: v.string(),
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    leaveType: v.string(), // "annual", "sick", "casual", "maternity", "paternity", "bereavement"
    startDate: v.number(),
    endDate: v.number(),
    totalDays: v.number(),
    reason: v.string(),
    status: v.string(), // "pending", "approved", "rejected", "cancelled"
    approvedBy: v.optional(v.id("hrEmployees")),
    approvedByName: v.optional(v.string()),
    approvalDate: v.optional(v.number()),
    comments: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    requestedAt: v.number(),
  })
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_date_range", ["startDate", "endDate"])
    .index("by_type", ["leaveType"]),

  // Leave Balance
  hrLeaveBalance: defineTable({
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    year: v.number(),
    annualLeaveBalance: v.number(),
    annualLeaveUsed: v.number(),
    sickLeaveBalance: v.number(),
    sickLeaveUsed: v.number(),
    casualLeaveBalance: v.number(),
    casualLeaveUsed: v.number(),
    maternityLeaveBalance: v.number(),
    maternityLeaveUsed: v.number(),
    paternityLeaveBalance: v.number(),
    paternityLeaveUsed: v.number(),
    bereavementLeaveBalance: v.number(),
    bereavementLeaveUsed: v.number(),
  })
    .index("by_employee_year", ["employeeId", "year"]),

  // Overtime Management
  hrOvertime: defineTable({
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    overtimeDate: v.number(),
    overtimeHours: v.number(),
    overtimeRate: v.number(), // Rate multiplier (1.5x, 2x)
    totalAmount: v.number(),
    reason: v.string(),
    approvedBy: v.optional(v.id("hrEmployees")),
    approvedByName: v.optional(v.string()),
    status: v.string(), // "pending", "approved", "rejected"
    notes: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_date", ["overtimeDate"])
    .index("by_status", ["status"]),

  // Salary Structure
  hrSalaryStructure: defineTable({
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    effectiveDate: v.number(),
    baseSalary: v.number(),
    dearness: v.optional(v.number()), // Dearness allowance
    houseRent: v.optional(v.number()), // HRA
    travelAllowance: v.optional(v.number()), // TA
    communicationAllowance: v.optional(v.number()), // CA
    medicalAllowance: v.optional(v.number()), // MA
    otherAllowances: v.optional(v.array(v.object({
      name: v.string(),
      amount: v.number(),
    }))),
    grossSalary: v.number(),
    basicDeduction: v.optional(v.number()),
    epfDeduction: v.optional(v.number()),
    esiDeduction: v.optional(v.number()),
    professionalTax: v.optional(v.number()),
    incomeTaxDeduction: v.optional(v.number()),
    otherDeductions: v.optional(v.array(v.object({
      name: v.string(),
      amount: v.number(),
    }))),
    netSalary: v.number(),
    status: v.string(), // "active", "inactive"
  })
    .index("by_employee", ["employeeId"])
    .index("by_effective_date", ["effectiveDate"]),

  // Payroll
  hrPayroll: defineTable({
    payrollId: v.string(), // PAYROLL-2026-01
    payrollMonth: v.number(), // Timestamp of month start
    payrollYear: v.number(),
    payrollMonthName: v.string(), // "January 2026"
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    baseSalary: v.number(),
    allowances: v.number(),
    grossSalary: v.number(),
    overtimeAmount: v.number(),
    bonusAmount: v.number(),
    incentiveAmount: v.number(),
    totalEarnings: v.number(),
    epfDeduction: v.number(),
    esiDeduction: v.number(),
    professionalTax: v.number(),
    incomeTaxDeduction: v.number(),
    otherDeductions: v.number(),
    totalDeductions: v.number(),
    netSalary: v.number(),
    status: v.string(), // "draft", "calculated", "approved", "paid", "pending"
    approvedBy: v.optional(v.id("users")),
    approvedByName: v.optional(v.string()),
    approvalDate: v.optional(v.number()),
    paidDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()), // "bank_transfer", "cash", "cheque"
    notes: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_month", ["payrollMonth"])
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"]),

  // Bonus & Incentive
  hrBonusIncentive: defineTable({
    bonusId: v.string(),
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    bonusType: v.string(), // "performance", "attendance", "sales", "milestone", "seasonal", "referral"
    amount: v.number(),
    percentage: v.optional(v.number()),
    basedOn: v.string(), // What the bonus is based on
    reason: v.string(),
    approvedBy: v.optional(v.id("hrEmployees")),
    approvedByName: v.optional(v.string()),
    approvalDate: v.optional(v.number()),
    disbursementDate: v.optional(v.number()),
    status: v.string(), // "pending", "approved", "disbursed", "cancelled"
    notes: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_type", ["bonusType"])
    .index("by_status", ["status"]),

  // Performance Management
  hrPerformance: defineTable({
    performanceId: v.string(),
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    reportingManagerId: v.id("hrEmployees"),
    reportingManagerName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    evaluationPeriodStart: v.number(),
    evaluationPeriodEnd: v.number(),
    kpis: v.array(v.object({
      kpiName: v.string(),
      targetValue: v.number(),
      achievedValue: v.number(),
      weight: v.number(), // Weightage in %
      score: v.number(), // 0-10
    })),
    overallScore: v.number(), // Average of all KPI scores
    technicalSkills: v.optional(v.number()), // 0-10
    communicationSkills: v.optional(v.number()),
    teamworkSkills: v.optional(v.number()),
    leadershipSkills: v.optional(v.number()),
    strengths: v.string(),
    areasForImprovement: v.string(),
    goalsSetting: v.optional(v.string()),
    reviewer: v.optional(v.id("users")),
    reviewerName: v.optional(v.string()),
    reviewDate: v.optional(v.number()),
    status: v.string(), // "draft", "submitted", "reviewed", "completed"
    comments: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_period", ["evaluationPeriodStart", "evaluationPeriodEnd"])
    .index("by_status", ["status"]),

  // EPF/Provident Fund
  hrProvidentFund: defineTable({
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    accountNumber: v.string(),
    memberType: v.string(), // "member", "employer", "both"
    memberContribution: v.number(), // Employee contribution per month
    employerContribution: v.number(), // Employer contribution per month
    investmentChoice: v.optional(v.string()), // Fund type
    totalBalance: v.number(),
    lastContributionDate: v.optional(v.number()),
    status: v.string(), // "active", "dormant", "closed"
  })
    .index("by_employee", ["employeeId"])
    .index("by_account", ["accountNumber"]),

  // ESI/Social Security
  hrSocialSecurity: defineTable({
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    esiNumber: v.string(),
    employerContribution: v.number(), // Monthly contribution
    employeeContribution: v.number(),
    registeredDate: v.number(),
    registrationStatus: v.string(), // "registered", "unregistered", "exempted"
    coverageType: v.string(), // "medical", "disability", "cash_benefits", "all"
    status: v.string(), // "active", "inactive", "closed"
  })
    .index("by_employee", ["employeeId"])
    .index("by_esi_number", ["esiNumber"]),

  // Salary Revision
  hrSalaryRevision: defineTable({
    revisionId: v.string(),
    employeeId: v.id("hrEmployees"),
    employeeName: v.string(),
    effectiveDate: v.number(),
    oldSalary: v.number(),
    newSalary: v.number(),
    percentageIncrease: v.number(),
    reason: v.string(),
    approvedBy: v.optional(v.id("hrEmployees")),
    approvedByName: v.optional(v.string()),
    approvalDate: v.optional(v.number()),
    status: v.string(), // "pending", "approved", "implemented", "rejected"
    notes: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_effective_date", ["effectiveDate"]),

  // ============================================
  // USER MANAGEMENT TABLES
  // ============================================

  // User Roles/Permissions
  userRoles: defineTable({
    roleName: v.string(), // "Super Admin", "Admin", "Manager", "Staff"
    description: v.string(),
    permissions: v.array(v.string()), // ["user_management", "inventory", "sales", "reports", "settings"]
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")), // Optional to allow system initialization
    createdByName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role_name", ["roleName"])
    .index("by_active", ["isActive"]),

  // User Management
  userManagement: defineTable({
    userId: v.string(), // USER-001
    firstName: v.string(),
    lastName: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    password: v.string(), // Hashed
    avatar: v.optional(v.string()),
    roleId: v.id("userRoles"),
    roleName: v.string(),
    branchId: v.optional(v.id("branches")),
    branchName: v.optional(v.string()),
    department: v.optional(v.string()),
    designation: v.optional(v.string()),
    joinDate: v.number(),
    lastLogin: v.optional(v.number()),
    status: v.string(), // "active", "inactive", "suspended", "archived"
    isSuperAdmin: v.boolean(),
    isAdmin: v.boolean(),
    canManageUsers: v.boolean(),
    canManageRoles: v.boolean(),
    canAccessReports: v.boolean(),
    canAccessSettings: v.boolean(),
    twoFactorEnabled: v.boolean(),
    twoFactorSecret: v.optional(v.string()),
    lastPasswordChange: v.optional(v.number()),
    passwordExpiresAt: v.optional(v.number()),
    loginAttempts: v.number(), // For account lockout
    isLocked: v.boolean(),
    lockedUntil: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdByName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_user_id", ["userId"])
    .index("by_role", ["roleId"])
    .index("by_branch", ["branchId"])
    .index("by_status", ["status"]),

  // User Activity Log
  userActivityLog: defineTable({
    userId: v.id("userManagement"),
    userName: v.string(),
    action: v.string(), // "login", "logout", "create", "update", "delete", "export"
    actionType: v.string(), // "user", "role", "inventory", "sales", "report"
    details: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    status: v.string(), // "success", "failed"
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // User Session Management
  userSessions: defineTable({
    userId: v.id("userManagement"),
    userName: v.string(),
    sessionToken: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    loginTime: v.number(),
    lastActivity: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
    deviceType: v.string(), // "desktop", "mobile", "tablet"
    location: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_session_token", ["sessionToken"])
    .index("by_active", ["isActive"]),

  // User Permissions Override
  userPermissionOverride: defineTable({
    userId: v.id("userManagement"),
    userName: v.string(),
    permission: v.string(),
    grantedBy: v.optional(v.id("users")),
    grantedByName: v.string(),
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()),
    reason: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),

  // Password Reset Tokens
  passwordResetTokens: defineTable({
    userId: v.id("userManagement"),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    isUsed: v.boolean(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // User Audit Trail
  userAuditTrail: defineTable({
    userId: v.id("userManagement"),
    userName: v.string(),
    actionType: v.string(), // "created", "updated", "deleted", "suspended"
    changedFields: v.object({
      fieldName: v.string(),
      oldValue: v.string(),
      newValue: v.string(),
    }),
    changedBy: v.optional(v.id("users")),
    changedByName: v.string(),
    reason: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // ✅ Refund Management System
  refunds: defineTable({
    refundNumber: v.string(), // Unique refund ID
    saleId: v.id("sales"),
    saleNumber: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    
    // Refund items (can be partial)
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(), // Quantity being refunded
      unitPrice: v.number(),
      totalPrice: v.number(),
      size: v.optional(v.string()),
      reason: v.string(), // "defective", "wrong_item", "customer_request", "expired", "other"
      condition: v.string(), // "new", "used", "damaged"
      notes: v.optional(v.string()),
    })),
    
    // Financial details
    subtotal: v.number(),
    tax: v.number(),
    discount: v.number(),
    refundAmount: v.number(), // Total amount to refund
    refundMethod: v.string(), // "cash", "mobile_banking", "card", "credit_account"
    
    // Payment reversal details
    originalPaymentMethod: v.string(),
    refundDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.string()),
      remark: v.optional(v.string()),
    })),
    
    // Status tracking
    status: v.string(), // "pending", "approved", "processed", "completed", "rejected", "cancelled"
    approvalStatus: v.optional(v.string()), // "pending_approval", "approved", "rejected"
    
    // Processing details
    processedBy: v.optional(v.id("users")),
    processedByName: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    approvedByName: v.optional(v.string()),
    
    // Dates & timestamps
    requestDate: v.number(),
    approvalDate: v.optional(v.number()),
    processedDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    
    // Reason & notes
    refundReason: v.string(), // "quality_issue", "change_of_mind", "wrong_product", "expired", "other"
    refundNotes: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    
    // Return tracking
    isReturned: v.boolean(), // Whether physical goods returned
    returnDate: v.optional(v.number()),
    returnCondition: v.optional(v.string()), // "good", "fair", "damaged"
    inspectionNotes: v.optional(v.string()),
    
    // Inventory impact
    restockRequired: v.boolean(),
    restockQuantity: v.optional(v.number()),
    restockDate: v.optional(v.number()),
    restockBranchId: v.optional(v.id("branches")),
  })
    .index("by_sale", ["saleId"])
    .index("by_branch", ["branchId"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_approval_status", ["approvalStatus"])
    .index("by_date", ["requestDate"])
    .index("by_refund_method", ["refundMethod"]),

  // Refund audit trail
  refundAuditTrail: defineTable({
    refundId: v.id("refunds"),
    refundNumber: v.string(),
    actionType: v.string(), // "created", "approved", "processed", "completed", "rejected", "status_changed"
    previousStatus: v.optional(v.string()),
    newStatus: v.string(),
    performedBy: v.id("users"),
    performedByName: v.string(),
    timestamp: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_refund", ["refundId"])
    .index("by_date", ["timestamp"])
    .index("by_user", ["performedBy"]),

  // Refund settings & policies
  refundPolicies: defineTable({
    branchId: v.id("branches"),
    branchName: v.string(),
    
    // Policies
    allowRefunds: v.boolean(),
    refundWindowDays: v.number(), // Days within which refund can be requested
    requireApproval: v.boolean(), // Whether manager approval needed
    maxRefundPercentage: v.number(), // Max % of sale amount
    requireReturnedGoods: v.boolean(), // Must goods be returned?
    allowPartialRefund: v.boolean(),
    
    // Default reasons
    allowedReasons: v.array(v.string()),
    requirePhotoEvidence: v.boolean(),
    requireManagerApprovalAbove: v.number(), // Manager approval required if amount exceeds this
    
    // Automatic refund
    autoApproveBelow: v.number(), // Auto-approve refunds below this amount
    autoCompleteAfterDays: v.number(), // Auto-complete after X days if no action
    
    // Restocking
    autoRestockRefundedItems: v.boolean(),
    restockPenalty: v.optional(v.number()), // % deducted from refund for handling
    
    // Notifications
    notifyManagerOnRefund: v.boolean(),
    notifyCustomerOnApproval: v.boolean(),
    notifyCustomerOnCompletion: v.boolean(),
    
    // Updated by
    updatedBy: v.id("users"),
    updatedByName: v.string(),
    lastUpdated: v.number(),
  })
    .index("by_branch", ["branchId"]),

  // Staff Product Images (Phase 2)
  staffProductImages: defineTable({
    productId: v.id("products"),
    barcode: v.string(),
    serialNumber: v.string(), // DBH-0001 format
    variantId: v.number(), // 1-100
    uploadedBy: v.id("users"), // Staff member who uploaded
    uploadedByName: v.string(),
    uploadedAt: v.number(),
    
    // Image metadata
    imageUrl: v.string(), // Cloudinary or storage URL
    imageKey: v.string(), // Storage key for reference
    originalSize: v.number(), // Bytes
    compressedSize: v.number(), // Bytes
    compressionRatio: v.number(), // Percentage
    format: v.string(), // "JPEG", "PNG", etc.
    
    // Additional info
    description: v.optional(v.string()), // Staff's description
    tags: v.array(v.string()), // For categorization
    position: v.number(), // 1, 2, or 3 (max 3 images per variant)
    
    // Engagement
    viewCount: v.number(),
    likes: v.number(),
    isApproved: v.boolean(), // Manager approval
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    
    // Metadata for search
    branchId: v.id("branches"),
    branchName: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_barcode", ["barcode"])
    .index("by_serial", ["serialNumber"])
    .index("by_variant", ["variantId"])
    .index("by_staff", ["uploadedBy"])
    .index("by_branch", ["branchId"])
    .index("by_approved", ["isApproved"])
    .index("by_date", ["uploadedAt"]),

  // Staff Product Activity Log (Phase 2)
  staffProductActivity: defineTable({
    staffId: v.id("users"),
    staffName: v.string(),
    branchId: v.id("branches"),
    branchName: v.string(),
    
    productId: v.optional(v.id("products")),
    productName: v.optional(v.string()),
    barcode: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    variantId: v.optional(v.number()),
    
    action: v.string(), // "scan", "image_upload", "image_delete", "note_added", "view"
    details: v.optional(v.object({
      imageId: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      fileName: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      noteText: v.optional(v.string()),
    })),
    
    timestamp: v.number(),
    status: v.string(), // "success", "failed", "pending"
  })
    .index("by_staff", ["staffId"])
    .index("by_branch", ["branchId"])
    .index("by_product", ["productId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // Staff Product Settings (Phase 3)
  staffProductSettings: defineTable({
    branchId: v.id("branches"),
    
    // Image settings
    imageCompressionEnabled: v.boolean(),
    targetImageSize: v.number(), // 100 = 100KB
    jpegQuality: v.number(), // 75-90
    maxImagesPerProduct: v.number(), // Usually 3
    allowImageDeletion: v.boolean(),
    enableAutoRotate: v.boolean(),
    autoDeleteOldImages: v.number(), // days (0 = disable)
    
    // Scanner settings
    enableFlashSupport: v.boolean(),
    continuousScan: v.boolean(),
    soundNotifications: v.boolean(),
    vibrationFeedback: v.boolean(),
    
    // Permissions
    canView: v.array(v.string()), // Roles that can view
    canUpload: v.array(v.string()), // Roles that can upload
    canDelete: v.array(v.string()), // Roles that can delete
    canApprove: v.array(v.string()), // Roles that can approve
    
    // Features
    enableCollaborativeNotes: v.boolean(),
    enableImageLiking: v.boolean(),
    enableDailyReport: v.boolean(),
    
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_branch", ["branchId"]),

  // Product Variants - For managing different color/size/stock combinations
  productVariants: defineTable({
    productId: v.id("products"),
    productName: v.string(),
    color: v.string(),
    sizes: v.array(v.string()), // Multiple sizes for this color variant
    stock: v.object({
      currentStock: v.number(),
      minStockLevel: v.number(),
      maxStockLevel: v.number(),
    }),
    variantCode: v.string(), // Unique variant code (e.g., PROD-001-RED)
    variantBarcode: v.string(), // Barcode for this specific variant
    price: v.optional(v.number()), // Can override base product price
    isActive: v.boolean(),
  })
    .index("by_product", ["productId"])
    .index("by_color", ["color"])
    .index("by_barcode", ["variantBarcode"]),
};



export default defineSchema({
  ...authTables,
  ...applicationTables,
});
