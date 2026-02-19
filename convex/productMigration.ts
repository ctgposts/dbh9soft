import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Migrate existing products to properly support variants
 * This function:
 * 1. Groups products by name/brand/fabric
 * 2. Creates productVariants for each unique color
 * 3. Updates main product with total stock
 */
export const migrateProductsToVariants = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    try {
      const products = await ctx.db.query("products").collect();
      const migrationReport = {
        totalProducts: products.length,
        variantsCreated: 0,
        productsUpdated: 0,
        errors: [] as string[],
      };
      
      // Group products by base name (removing color/size info)
      const baseProductMap = new Map<string, typeof products>();
      
      for (const product of products) {
        // Create a base key from product name, brand, and fabric
        const baseKey = `${product.name}|${product.brand}|${product.fabric}`;
        
        if (!baseProductMap.has(baseKey)) {
          baseProductMap.set(baseKey, []);
        }
        baseProductMap.get(baseKey)!.push(product);
      }
      
      // Process each base product group
      for (const [baseKey, productGroup] of baseProductMap) {
        if (productGroup.length === 1) {
          // Single product - create variant if it doesn't exist
          const product = productGroup[0];
          
          try {
            const existingVariant = await ctx.db
              .query("productVariants")
              .withIndex("by_product", (q) => q.eq("productId", product._id))
              .first();
            
            if (!existingVariant) {
              // Create variant for this product
              const variantCode = `${product.productCode}-${product.color.substring(0, 3).toUpperCase()}`;
              
              await ctx.db.insert("productVariants", {
                productId: product._id,
                productName: product.name,
                color: product.color,
                sizes: product.sizes || [],
                stock: {
                  currentStock: product.currentStock,
                  minStockLevel: product.minStockLevel,
                  maxStockLevel: product.maxStockLevel,
                },
                variantCode,
                variantBarcode: product.barcode,
                isActive: product.isActive,
              });
              
              migrationReport.variantsCreated++;
            }
          } catch (error: any) {
            migrationReport.errors.push(
              `Failed to process ${product.name}: ${error.message}`
            );
          }
        } else {
          // Multiple products with same name/brand/fabric - different colors
          try {
            // Use first product as main product
            const mainProduct = productGroup[0];
            let totalStock = 0;
            
            // Create variants for each color variant
            for (let i = 0; i < productGroup.length; i++) {
              const product = productGroup[i];
              const variantCode = `${mainProduct.productCode}-${product.color.substring(0, 3).toUpperCase()}`;
              
              // Check if variant already exists
              const existingVariant = await ctx.db
                .query("productVariants")
                .withIndex("by_product", (q) => q.eq("productId", mainProduct._id))
                .first();
              
              if (!existingVariant) {
                await ctx.db.insert("productVariants", {
                  productId: mainProduct._id,
                  productName: mainProduct.name,
                  color: product.color,
                  sizes: product.sizes || [],
                  stock: {
                    currentStock: product.currentStock,
                    minStockLevel: product.minStockLevel,
                    maxStockLevel: product.maxStockLevel,
                  },
                  variantCode,
                  variantBarcode: product.barcode,
                  isActive: product.isActive,
                });
              }
              
              totalStock += product.currentStock;
              migrationReport.variantsCreated++;
            }
            
            // Update main product with total stock
            await ctx.db.patch(mainProduct._id, {
              currentStock: totalStock,
            });
            
            migrationReport.productsUpdated++;
          } catch (error: any) {
            migrationReport.errors.push(
              `Failed to migrate group ${baseKey}: ${error.message}`
            );
          }
        }
      }
      
      return migrationReport;
    } catch (error: any) {
      throw new Error(`Migration failed: ${error.message}`);
    }
  },
});

/**
 * Verify product variant consistency
 */
export const verifyVariantConsistency = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const products = await ctx.db.query("products").collect();
    const issues = {
      productsWithoutVariants: [] as string[],
      stockMismatches: [] as { productName: string; expected: number; actual: number }[],
    };
    
    for (const product of products) {
      if (!product.isActive) continue;
      
      const variants = await ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .collect();
      
      if (variants.length === 0) {
        issues.productsWithoutVariants.push(product.name);
      } else {
        const variantStock = variants
          .filter(v => v.isActive)
          .reduce((sum, v) => sum + v.stock.currentStock, 0);
        
        if (variantStock !== product.currentStock) {
          issues.stockMismatches.push({
            productName: product.name,
            expected: product.currentStock,
            actual: variantStock,
          });
        }
      }
    }
    
    return {
      totalProducts: products.length,
      issuesFound: issues.productsWithoutVariants.length + issues.stockMismatches.length,
      details: issues,
    };
  },
});

/**
 * Fix stock mismatches by syncing product stock with variant totals
 */
export const fixStockMismatches = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const products = await ctx.db.query("products").collect();
    let fixed = 0;
    
    for (const product of products) {
      if (!product.isActive) continue;
      
      const variants = await ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .collect();
      
      const variantStock = variants
        .filter(v => v.isActive)
        .reduce((sum, v) => sum + v.stock.currentStock, 0);
      
      if (variantStock !== product.currentStock) {
        await ctx.db.patch(product._id, {
          currentStock: variantStock,
        });
        fixed++;
      }
    }
    
    return {
      productsFixed: fixed,
      message: `Fixed stock for ${fixed} product(s)`,
    };
  },
});

/**
 * Create missing variants for products without variants
 */
export const createMissingVariants = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const products = await ctx.db.query("products").collect();
    let created = 0;
    
    for (const product of products) {
      if (!product.isActive) continue;
      
      const existingVariant = await ctx.db
        .query("productVariants")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .first();
      
      if (!existingVariant) {
        const variantCode = `${product.productCode}-${product.color.substring(0, 3).toUpperCase()}`;
        
        await ctx.db.insert("productVariants", {
          productId: product._id,
          productName: product.name,
          color: product.color,
          sizes: product.sizes || [],
          stock: {
            currentStock: product.currentStock,
            minStockLevel: product.minStockLevel,
            maxStockLevel: product.maxStockLevel,
          },
          variantCode,
          variantBarcode: product.barcode,
          isActive: true,
        });
        
        created++;
      }
    }
    
    return {
      variantsCreated: created,
      message: `Created ${created} missing variant(s)`,
    };
  },
});
