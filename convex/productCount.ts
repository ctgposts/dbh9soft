import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * ✅ Comprehensive Debugging Query: Analyze product loading
 * This query returns detailed diagnostic information about products
 */
export const diagnostics = query({
  handler: async (ctx) => {
    try {
      await getAuthUserId(ctx);
      
      // Get ALL products (no filters)
      const allProducts = await ctx.db.query("products").collect();
      console.log(`🔍 [DIAGNOSTICS] Total documents in 'products' table: ${allProducts.length}`);
      
      // Check for various fields
      const activeProducts = allProducts.filter(p => p.isActive === true);
      const inactiveProducts = allProducts.filter(p => p.isActive === false);
      const noStatusProducts = allProducts.filter(p => p.isActive === undefined || p.isActive === null);
      
      console.log(`📊 [BREAKDOWN]`);
      console.log(`  ✅ Active (isActive=true): ${activeProducts.length}`);
      console.log(`  ❌ Inactive (isActive=false): ${inactiveProducts.length}`);
      console.log(`  ⚠️  No status (undefined/null): ${noStatusProducts.length}`);
      
      // Get sample products
      const samples = allProducts.slice(0, 3);
      console.log(`\n📦 [SAMPLE PRODUCTS]`);
      samples.forEach((p, i) => {
        console.log(`  ${i + 1}. Name: ${p.name || 'NO NAME'}, isActive: ${p.isActive}, Stock: ${p.currentStock || 0}`);
      });
      
      // Check for required fields
      const missingName = allProducts.filter(p => !p.name).length;
      const missingPrice = allProducts.filter(p => !p.sellingPrice).length;
      const missingStock = allProducts.filter(p => p.currentStock === undefined || p.currentStock === null).length;
      
      console.log(`\n⚠️ [MISSING FIELDS]`);
      console.log(`  Missing name: ${missingName}`);
      console.log(`  Missing price: ${missingPrice}`);
      console.log(`  Missing stock: ${missingStock}`);
      
      return {
        success: true,
        diagnostics: {
          totalInDatabase: allProducts.length,
          activeCount: activeProducts.length,
          inactiveCount: inactiveProducts.length,
          noStatusCount: noStatusProducts.length,
          firstProductId: allProducts[0]?._id || 'NO PRODUCTS',
          firstProductName: allProducts[0]?.name || 'NO NAME',
          missingFields: { missingName, missingPrice, missingStock },
          message: allProducts.length > 0 
            ? `✅ Database has ${allProducts.length} total products, ${activeProducts.length} active`
            : `❌ NO PRODUCTS FOUND IN DATABASE!`
        }
      };
    } catch (error: any) {
      console.error(`❌ [ERROR] ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `❌ Error occurred: ${error.message}`
      };
    }
  },
});

/**
 * Test query - simulates frontend call exactly
 */
export const testList = query({
  args: {},
  handler: async (ctx) => {
    try {
      await getAuthUserId(ctx);
      
      console.log(`\n🧪 [TEST: api.products.list call]`);
      
      let products = await ctx.db.query("products").collect();
      console.log(`Step 1: Total from DB: ${products.length}`);
      
      products = products.filter(product => product.isActive);
      console.log(`Step 2: After isActive filter: ${products.length}`);
      
      const totalCount = products.length;
      console.log(`Step 3: Total count for response: ${totalCount}`);
      
      const response = {
        items: products,
        pagination: {
          total: totalCount,
          limit: products.length,
          offset: 0,
          hasMore: false,
          pageNumber: 1,
          totalPages: 1,
        }
      };
      
      console.log(`Step 4: Response items count: ${response.items.length}`);
      console.log(`✅ Test successful - returning ${response.items.length} products`);
      
      return response;
    } catch (error: any) {
      console.error(`❌ [TEST ERROR] ${error.message}`);
      throw error;
    }
  },
});
