import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db.query("products").collect();
    const sales = await ctx.db.query("sales").collect();
    const customers = await ctx.db.query("customers").collect();
    
    // Calculate today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysSales = sales
      .filter(sale => sale._creationTime >= today.getTime())
      .reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate this week's sales
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSales = sales
      .filter(sale => sale._creationTime >= weekAgo.getTime())
      .reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate this month's sales
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthSales = sales
      .filter(sale => sale._creationTime >= monthAgo.getTime())
      .reduce((sum, sale) => sum + sale.total, 0);
    
    // Count orders
    const todayOrders = sales.filter(sale => sale._creationTime >= today.getTime()).length;
    const weekOrders = sales.filter(sale => sale._creationTime >= weekAgo.getTime()).length;
    const monthOrders = sales.filter(sale => sale._creationTime >= monthAgo.getTime()).length;
    
    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Count low stock products
    const lowStockCount = products.filter(product => 
      product.isActive && product.currentStock <= product.minStockLevel
    ).length;
    
    // Count total categories
    const categories = await ctx.db.query("categories").collect();
    const totalCategories = categories.length;
    
    const totalAbayas = products
      .filter(product => product.isActive)
      .reduce((sum, product) => sum + product.currentStock, 0);
    
    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, product) => 
      sum + (product.costPrice * product.currentStock), 0
    );
    
    // Get low stock products
    const lowStockProducts = products.filter(product => 
      product.isActive && product.currentStock <= product.minStockLevel
    );
    
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      totalAbayas,
      totalCategories,
      lowStockCount,
      todaysSales,
      weekSales,
      monthSales,
      todayOrders,
      weekOrders,
      monthOrders,
      totalRevenue,
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.isActive !== false).length,
      totalInventoryValue,
      lowStockProducts,
    };
  },
});

export const getRecentSales = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("sales")
      .order("desc")
      .take(5);
  },
});

export const getLowStockProducts = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("products")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.lte(q.field("currentStock"), q.field("minStockLevel"))
      ))
      .order("asc")
      .take(10);
  },
});

export const getTopProducts = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const sales = await ctx.db.query("sales").collect();
    const productSales: Record<string, any> = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = {
            productId: item.productId,
            productName: item.productName,
            totalSold: 0
          };
        }
        productSales[key].totalSold += item.quantity;
      });
    });
    
    return Object.values(productSales)
      .sort((a: any, b: any) => b.totalSold - a.totalSold)
      .slice(0, 10)
      .map((product: any) => ({
        _id: product.productId,
        name: product.productName,
        totalSold: product.totalSold
      }));
  },
});
