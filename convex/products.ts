import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    searchTerm: v.optional(v.string()),
    brand: v.optional(v.string()),
    style: v.optional(v.string()),
    fabric: v.optional(v.string()),
    color: v.optional(v.string()),
    occasion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let products;
    
    if (args.categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }
    
    // Ensure all products have branchStock initialized
    const branches = await ctx.db.query("branches").collect();
    
    products = products.map(product => {
      // If branchStock is empty or missing, initialize it with all branches
      if (!product.branchStock || product.branchStock.length === 0) {
        const initializeBranchStock = branches.map(branch => ({
          branchId: branch._id,
          branchName: branch.name,
          currentStock: product.currentStock || 0,
          minStockLevel: product.minStockLevel || 0,
          maxStockLevel: product.maxStockLevel || 100,
        }));
        return { ...product, branchStock: initializeBranchStock };
      }
      return product;
    });
    
    // Filter by various abaya attributes
    if (args.brand) {
      products = products.filter(product => 
        product.brand.toLowerCase() === args.brand!.toLowerCase()
      );
    }
    
    if (args.style) {
      products = products.filter(product => 
        product.style && product.style.toLowerCase() === args.style!.toLowerCase()
      );
    }
    
    if (args.fabric) {
      products = products.filter(product => 
        product.fabric.toLowerCase() === args.fabric!.toLowerCase()
      );
    }
    
    if (args.color) {
      products = products.filter(product => 
        product.color.toLowerCase() === args.color!.toLowerCase()
      );
    }
    
    if (args.occasion) {
      products = products.filter(product => 
        product.occasion && product.occasion.toLowerCase() === args.occasion!.toLowerCase()
      );
    }
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        (product.model && product.model.toLowerCase().includes(searchLower)) ||
        (product.style && product.style.toLowerCase().includes(searchLower)) ||
        product.fabric.toLowerCase().includes(searchLower) ||
        product.color.toLowerCase().includes(searchLower) ||
        (product.occasion && product.occasion.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
    }
    
    return products.filter(product => product.isActive);
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

// Production Query: খুঁজুন পণ্য বারকোড দ্বারা
export const getByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // বারকোড normalize করুন
    const normalizedBarcode = args.barcode.trim().toUpperCase();
    
    // সমস্ত পণ্য খুঁজুন (যেহেতু barcode index নেই, সবগুলি scan করব)
    const products = await ctx.db.query("products").collect();
    
    // বারকোড দ্বারা মিল করুন (case-insensitive)
    const found = products.find(p => 
      p.barcode && p.barcode.toUpperCase() === normalizedBarcode && p.isActive
    );
    
    if (!found) {
      return null;
    }
    
    return found;
  },
});

// Production Query: সমস্ত সক্রিয় পণ্য (স্টাফ স্ক্যানারের জন্য)
export const listActive = query({
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db.query("products").collect();
    return products.filter(product => product.isActive).map(p => ({
      _id: p._id,
      name: p.name,
      brand: p.brand,
      category: p.style || "সাধারণ",
      categoryId: p.categoryId,
      price: p.sellingPrice,
      discountedPrice: p.sellingPrice * 0.85, // 15% ছাড় প্রদর্শনের জন্য
      fabric: p.fabric,
      color: p.color,
      sizes: p.sizes,
      stock: p.currentStock,
      material: `${p.fabric}${p.embellishments ? ', ' + p.embellishments : ''}`,
      embellishments: p.embellishments,
      barcode: p.barcode,
      rating: 4.5, // Default rating
      reviews: 100, // Default reviews
      imageUrl: p.pictureUrl || 'https://via.placeholder.com/300x400?text=পণ্য',
      description: p.description,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    model: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    style: v.optional(v.string()),
    fabric: v.string(),
    color: v.string(),
    sizes: v.array(v.string()),
    embellishments: v.optional(v.string()),
    occasion: v.optional(v.string()),
    costPrice: v.number(),
    sellingPrice: v.number(),
    barcode: v.optional(v.string()),
    productCode: v.optional(v.string()),
    madeBy: v.optional(v.string()),
    stockLocation: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    currentStock: v.number(),
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    // Validate required fields
    if (!args.name || args.name.trim().length < 2) {
      throw new Error("Product name must be at least 2 characters long");
    }
    
    if (!args.brand || args.brand.trim().length < 2) {
      throw new Error("Brand name must be at least 2 characters long");
    }
    
    if (!args.fabric || args.fabric.trim().length === 0) {
      throw new Error("Fabric selection is required");
    }
    
    if (!args.color || args.color.trim().length < 2) {
      throw new Error("Color must be at least 2 characters long");
    }
    
    if (!args.sizes || args.sizes.length === 0) {
      throw new Error("At least one size must be selected");
    }
    
    if (args.sellingPrice <= 0) {
      throw new Error("Selling price must be greater than 0");
    }
    
    if (args.costPrice < 0) {
      throw new Error("Cost price cannot be negative");
    }
    
    if (args.currentStock < 0) {
      throw new Error("Current stock cannot be negative");
    }
    
    if (args.minStockLevel < 0) {
      throw new Error("Minimum stock level cannot be negative");
    }
    
    if (args.maxStockLevel < 1) {
      throw new Error("Maximum stock level must be at least 1");
    }
    
    if (args.minStockLevel > args.maxStockLevel) {
      throw new Error("Minimum stock level cannot exceed maximum stock level");
    }

    // Check for duplicate product code
    if (args.productCode) {
      const existingProduct = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("productCode"), args.productCode))
        .first();
      
      if (existingProduct) {
        throw new Error("Product code already exists");
      }
    }

    // Check for duplicate barcode
    if (args.barcode) {
      const existingBarcode = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("barcode"), args.barcode))
        .first();
      
      if (existingBarcode) {
        throw new Error("Barcode already exists");
      }
    }
    
    // Generate product code and barcode if not provided
    const timestamp = Date.now().toString().slice(-6);
    const productCode = args.productCode || `AB${timestamp}`;
    const barcode = args.barcode || `${productCode}${args.sellingPrice.toString().padStart(4, '0')}`;
    
    // Get all branches to initialize stock levels
    const allBranches = await ctx.db.query("branches").collect();
    
    // Find default branch and initialize branch stock
    const defaultBranch = allBranches.length > 0 ? allBranches[0] : null;
    const branchStock = allBranches.map((branch) => ({
      branchId: branch._id,
      branchName: branch.name,
      currentStock: branch._id === defaultBranch?._id ? args.currentStock : 0,
      minStockLevel: args.minStockLevel,
      maxStockLevel: args.maxStockLevel,
    }));
    
    const productId = await ctx.db.insert("products", {
      name: args.name.trim(),
      brand: args.brand.trim(),
      model: args.model?.trim() || productCode,
      categoryId: args.categoryId,
      style: args.style?.trim() || "Modern",
      fabric: args.fabric.trim(),
      color: args.color.trim(),
      sizes: args.sizes,
      embellishments: args.embellishments?.trim() || "",
      occasion: args.occasion?.trim() || "Daily Wear",
      costPrice: args.costPrice,
      sellingPrice: args.sellingPrice,
      productCode,
      barcode,
      madeBy: args.madeBy?.trim() || "",
      stockLocation: args.stockLocation?.trim() || "",
      pictureUrl: args.pictureUrl?.trim() || "",
      branchStock: branchStock,
      currentStock: args.currentStock,
      minStockLevel: args.minStockLevel,
      maxStockLevel: args.maxStockLevel,
      description: args.description?.trim() || "",
      isActive: args.isActive ?? true,
    });
    
    // Record initial stock movement
    if (args.currentStock > 0 && defaultBranch) {
      await ctx.db.insert("stockMovements", {
        productId,
        productName: args.name.trim(),
        branchId: defaultBranch._id,
        branchName: defaultBranch.name,
        type: "in",
        quantity: args.currentStock,
        reason: "Initial Stock",
        userId,
        userName: user.name || user.email || "Unknown",
        previousStock: 0,
        newStock: args.currentStock,
      });
    }
    
    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    brand: v.string(),
    model: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    style: v.optional(v.string()),
    fabric: v.string(),
    color: v.string(),
    sizes: v.array(v.string()),
    embellishments: v.optional(v.string()),
    occasion: v.optional(v.string()),
    costPrice: v.number(),
    sellingPrice: v.number(),
    barcode: v.optional(v.string()),
    productCode: v.optional(v.string()),
    madeBy: v.optional(v.string()),
    stockLocation: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existingProduct = await ctx.db.get(args.id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }
    
    // Validate required fields
    if (!args.name || args.name.trim().length < 2) {
      throw new Error("Product name must be at least 2 characters long");
    }
    
    if (!args.brand || args.brand.trim().length < 2) {
      throw new Error("Brand name must be at least 2 characters long");
    }
    
    if (!args.fabric || args.fabric.trim().length === 0) {
      throw new Error("Fabric selection is required");
    }
    
    if (!args.color || args.color.trim().length < 2) {
      throw new Error("Color must be at least 2 characters long");
    }
    
    if (!args.sizes || args.sizes.length === 0) {
      throw new Error("At least one size must be selected");
    }
    
    if (args.sellingPrice <= 0) {
      throw new Error("Selling price must be greater than 0");
    }
    
    if (args.costPrice < 0) {
      throw new Error("Cost price cannot be negative");
    }
    
    if (args.minStockLevel < 0) {
      throw new Error("Minimum stock level cannot be negative");
    }
    
    if (args.maxStockLevel < 1) {
      throw new Error("Maximum stock level must be at least 1");
    }
    
    if (args.minStockLevel > args.maxStockLevel) {
      throw new Error("Minimum stock level cannot exceed maximum stock level");
    }

    // Check for duplicate product code (excluding current product)
    if (args.productCode && args.productCode !== existingProduct.productCode) {
      const duplicateProduct = await ctx.db
        .query("products")
        .filter((q) => q.and(
          q.eq(q.field("productCode"), args.productCode),
          q.neq(q.field("_id"), args.id)
        ))
        .first();
      
      if (duplicateProduct) {
        throw new Error("Product code already exists");
      }
    }

    // Check for duplicate barcode (excluding current product)
    if (args.barcode && args.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await ctx.db
        .query("products")
        .filter((q) => q.and(
          q.eq(q.field("barcode"), args.barcode),
          q.neq(q.field("_id"), args.id)
        ))
        .first();
      
      if (duplicateBarcode) {
        throw new Error("Barcode already exists");
      }
    }
    
    const { id, ...updateData } = args;
    
    // Update branch stock levels if min/max stock levels changed
    let updatedBranchStock = existingProduct.branchStock;
    if (
      updateData.minStockLevel !== existingProduct.minStockLevel ||
      updateData.maxStockLevel !== existingProduct.maxStockLevel
    ) {
      updatedBranchStock = existingProduct.branchStock.map((bs: any) => ({
        ...bs,
        minStockLevel: updateData.minStockLevel,
        maxStockLevel: updateData.maxStockLevel,
      }));
    }
    
    await ctx.db.patch(id, {
      name: updateData.name.trim(),
      brand: updateData.brand.trim(),
      model: updateData.model?.trim(),
      categoryId: updateData.categoryId,
      style: updateData.style?.trim(),
      fabric: updateData.fabric.trim(),
      color: updateData.color.trim(),
      sizes: updateData.sizes,
      embellishments: updateData.embellishments?.trim(),
      occasion: updateData.occasion?.trim(),
      costPrice: updateData.costPrice,
      sellingPrice: updateData.sellingPrice,
      barcode: updateData.barcode?.trim(),
      productCode: updateData.productCode?.trim(),
      madeBy: updateData.madeBy?.trim(),
      stockLocation: updateData.stockLocation?.trim(),
      pictureUrl: updateData.pictureUrl?.trim(),
      minStockLevel: updateData.minStockLevel,
      maxStockLevel: updateData.maxStockLevel,
      description: updateData.description?.trim(),
      isActive: updateData.isActive,
      branchStock: updatedBranchStock,
    });
    
    return id;
  },
});

export const adjustStock = mutation({
  args: {
    productId: v.id("products"),
    newStock: v.number(),
    reason: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    const product = await ctx.db.get(args.productId);
    
    if (!product || !user) throw new Error("Product or user not found");
    
    if (args.newStock < 0) {
      throw new Error("Stock cannot be negative");
    }
    
    const previousStock = product.currentStock;
    const difference = args.newStock - previousStock;
    
    // Get first branch as default and update branch stock
    const defaultBranch = await ctx.db.query("branches").first();
    let updatedBranchStock = product.branchStock;
    
    if (defaultBranch && defaultBranch._id) {
      updatedBranchStock = product.branchStock.map((bs: any) => {
        if (bs.branchId === defaultBranch._id) {
          return {
            ...bs,
            currentStock: args.newStock,
          };
        }
        return bs;
      });
    }
    
    await ctx.db.patch(args.productId, {
      currentStock: args.newStock,
      branchStock: updatedBranchStock,
    });
    
    // Record stock movement
    if (difference !== 0 && defaultBranch && defaultBranch._id) {
      await ctx.db.insert("stockMovements", {
        productId: args.productId,
        productName: product.name,
        branchId: defaultBranch._id,
        branchName: defaultBranch.name,
        type: difference > 0 ? "in" : "out",
        quantity: Math.abs(difference),
        reason: args.reason,
        notes: args.notes,
        userId,
        userName: user.name || user.email || "Unknown",
        previousStock,
        newStock: args.newStock,
      });
    }
    
    return args.productId;
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if product has any sales
    const sales = await ctx.db
      .query("sales")
      .collect();
    
    const hasSales = sales.some(sale => 
      sale.items.some(item => item.productId === args.id)
    );
    
    if (hasSales) {
      throw new Error("Cannot delete product with existing sales records");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getLowStock = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db.query("products").collect();
    return products.filter(product => 
      product.isActive && product.currentStock <= product.minStockLevel
    );
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db.query("products").collect();
    const activeProducts = products.filter(p => p.isActive);
    
    const totalValue = activeProducts.reduce((sum, product) => 
      sum + (product.currentStock * product.costPrice), 0
    );
    
    const lowStockProducts = activeProducts.filter(product => 
      product.currentStock <= product.minStockLevel
    );
    
    const outOfStockProducts = activeProducts.filter(product => 
      product.currentStock === 0
    );
    
    // Group by style
    const styleStats = activeProducts.reduce((acc, product) => {
      const style = product.style || "Unknown";
      acc[style] = (acc[style] || 0) + product.currentStock;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by fabric
    const fabricStats = activeProducts.reduce((acc, product) => {
      acc[product.fabric] = (acc[product.fabric] || 0) + product.currentStock;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by color
    const colorStats = activeProducts.reduce((acc, product) => {
      acc[product.color] = (acc[product.color] || 0) + product.currentStock;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalProducts: activeProducts.length,
      totalStock: activeProducts.reduce((sum, p) => sum + p.currentStock, 0),
      totalValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      styleStats,
      fabricStats,
      colorStats,
    };
  },
});

export const getStockMovements = query({
  args: {
    productId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let movements;
    
    if (args.productId) {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_product", (q) => q.eq("productId", args.productId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      movements = await ctx.db
        .query("stockMovements")
        .order("desc")
        .take(args.limit || 50);
    }
    
    return movements;
  },
});

/**
 * Create product with multiple variants (color + size combinations)
 * This creates a main product and separate variant entries
 */
export const createWithVariants = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    model: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    style: v.optional(v.string()),
    fabric: v.string(),
    embellishments: v.optional(v.string()),
    occasion: v.optional(v.string()),
    costPrice: v.number(),
    sellingPrice: v.number(),
    madeBy: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    minStockLevel: v.number(),
    maxStockLevel: v.number(),
    description: v.optional(v.string()),
    variants: v.array(v.object({
      color: v.string(),
      sizes: v.array(v.string()),
      stock: v.number(),
      barcode: v.optional(v.string()),
      price: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    // Basic validation
    if (!args.name?.trim()) throw new Error("Product name required");
    if (!args.brand?.trim()) throw new Error("Brand required");
    if (!args.fabric?.trim()) throw new Error("Fabric required");
    if (args.variants.length === 0) throw new Error("At least one variant required");
    if (args.sellingPrice <= 0) throw new Error("Selling price must be > 0");
    
    // Generate product code
    const timestamp = Date.now().toString().slice(-6);
    const productCode = `PRD${timestamp}`;
    
    // Create base product (will use first variant's color as default)
    const firstVariant = args.variants[0];
    const totalStock = args.variants.reduce((sum, v) => sum + v.stock, 0);
    
    // Get all branches to initialize stock levels
    const allBranches = await ctx.db.query("branches").collect();
    const defaultBranch = allBranches.length > 0 ? allBranches[0] : null;
    const branchStock = allBranches.map((branch) => ({
      branchId: branch._id,
      branchName: branch.name,
      currentStock: branch._id === defaultBranch?._id ? totalStock : 0,
      minStockLevel: args.minStockLevel,
      maxStockLevel: args.maxStockLevel,
    }));
    
    const productId = await ctx.db.insert("products", {
      name: args.name.trim(),
      brand: args.brand.trim(),
      model: args.model?.trim() || productCode,
      categoryId: args.categoryId,
      style: args.style?.trim() || "Modern",
      fabric: args.fabric.trim(),
      color: firstVariant.color, // Primary color
      sizes: firstVariant.sizes,
      embellishments: args.embellishments?.trim() || "",
      occasion: args.occasion?.trim() || "Daily Wear",
      costPrice: args.costPrice,
      sellingPrice: args.sellingPrice,
      productCode,
      barcode: firstVariant.barcode || `${productCode}001`,
      madeBy: args.madeBy?.trim() || "",
      pictureUrl: args.pictureUrl?.trim() || "",
      branchStock: branchStock,
      currentStock: totalStock,
      minStockLevel: args.minStockLevel,
      maxStockLevel: args.maxStockLevel,
      description: args.description?.trim() || "",
      isActive: true,
    });
    
    // Create variant entries
    for (let i = 0; i < args.variants.length; i++) {
      const variant = args.variants[i];
      const variantCode = `${productCode}-${variant.color.substring(0, 3).toUpperCase()}`;
      const variantBarcode = variant.barcode || `${productCode}${String(i + 1).padStart(3, '0')}`;
      
      await ctx.db.insert("productVariants", {
        productId,
        productName: args.name.trim(),
        color: variant.color,
        sizes: variant.sizes,
        stock: {
          currentStock: variant.stock,
          minStockLevel: args.minStockLevel,
          maxStockLevel: args.maxStockLevel,
        },
        variantCode,
        variantBarcode,
        price: variant.price,
        isActive: true,
      });
    }
    
    // Record stock movement (using defaultBranch from line 712)
    if (defaultBranch && totalStock > 0) {
      await ctx.db.insert("stockMovements", {
        productId,
        productName: args.name.trim(),
        branchId: defaultBranch._id,
        branchName: defaultBranch.name,
        type: "in",
        quantity: totalStock,
        reason: "Initial Stock",
        userId,
        userName: user.name || user.email || "Unknown",
        previousStock: 0,
        newStock: totalStock,
      });
    }
    
    return {
      productId,
      variantCount: args.variants.length,
      totalStock,
    };
  },
});

/**
 * Search products including variant information
 */
export const searchWithVariants = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const searchLower = args.searchTerm.toLowerCase();
    const products = await ctx.db.query("products").collect();
    
    const filtered = products.filter(p => 
      p.isActive && (
        p.name.toLowerCase().includes(searchLower) ||
        p.barcode.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.productCode.toLowerCase().includes(searchLower)
      )
    );
    
    // Get variants for each product
    const withVariants = await Promise.all(
      filtered.map(async (product) => {
        const variants = await ctx.db
          .query("productVariants")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect();
        
        return {
          product,
          variants: variants.filter(v => v.isActive),
        };
      })
    );
    
    return withVariants;
  },
});

export const syncBranchStockForAllProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allProducts = await ctx.db.query("products").collect();
    const allBranches = await ctx.db.query("branches").collect();

    let syncedCount = 0;

    for (const product of allProducts) {
      // Check if product needs syncing
      const needsSync =
        !product.branchStock || product.branchStock.length === 0;

      if (needsSync) {
        const initializeBranchStock = allBranches.map((branch) => ({
          branchId: branch._id,
          branchName: branch.name,
          currentStock: product.currentStock || 0,
          minStockLevel: product.minStockLevel || 0,
          maxStockLevel: product.maxStockLevel || 100,
        }));

        await ctx.db.patch(product._id, {
          branchStock: initializeBranchStock,
        });

        syncedCount++;
      }
    }

    return {
      message: `Synced ${syncedCount} products with branch stock data`,
      totalProducts: allProducts.length,
      syncedProducts: syncedCount,
    };
  },
});

export const autoAssignBoxNumbers = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allProducts = await ctx.db.query("products").collect();

    // Group products by: categoryId + sellingPrice + fabric + embellishments
    const groupMap = new Map<string, any[]>();

    for (const product of allProducts) {
      const groupKey = `${product.categoryId || 'no-category'}|${product.sellingPrice}|${product.fabric}|${product.embellishments || 'none'}`;
      
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(product);
    }

    // Assign ONE box number to entire group
    // All products in the same group get the same BOX number
    let totalAssigned = 0;
    let groupCount = 0;

    for (const [groupKey, productsInGroup] of groupMap) {
      groupCount++;
      const boxNumber = `BOX-${groupCount}`; // সম্পূর্ণ গ্রুপের জন্য একটি BOX
      
      // গ্রুপের সব পণ্যকে একই বক্স নম্বার দিন
      for (const product of productsInGroup) {
        await ctx.db.patch(product._id, {
          stockLocation: boxNumber,
        });
        totalAssigned++;
      }
    }

    return {
      message: `${totalAssigned}টি পণ্য ${groupCount}টি গ্রুপে দরবস্ত করা হয়েছে`,
      totalProducts: allProducts.length,
      groupsCreated: groupCount,
      productsAssigned: totalAssigned,
      details: `প্রতিটি গ্রুপের সব পণ্য একটি BOX-এ: ক্যাটাগরি + দাম + ফেব্রিক + কারুকার্য = একটি BOX`,
    };
  },
});

