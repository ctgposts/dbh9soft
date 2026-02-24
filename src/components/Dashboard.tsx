import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { useCustomNotificationSounds } from "../hooks/useCustomNotificationSounds";
import { useNotificationSystem, NotificationPresets } from "../hooks/useNotificationSystem";
import { NotificationAlertsPanel, NotificationIcon, DashboardAlertsSummary } from "./NotificationAlertsPanel";
import { useState, useEffect, useRef } from "react";
import FabricAnalyzer from "./FabricAnalyzer";

// Skeleton component for loading cards
const MetricCardSkeleton = () => (
  <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-6 animate-pulse">
    <div className="flex items-start justify-between mb-2 sm:mb-4">
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded w-24" />
        <div className="h-8 sm:h-10 bg-slate-200 rounded w-16 mt-2" />
      </div>
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-slate-200" />
    </div>
    <div className="h-3 bg-slate-200 rounded w-32" />
  </div>
);

const SalesCardSkeleton = () => (
  <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 animate-pulse">
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-200 rounded" />
      <div className="h-6 bg-slate-200 rounded w-40" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map(() => (
        <div key={Math.random()} className="h-20 bg-slate-100 rounded" />
      ))}
    </div>
  </div>
);

export function Dashboard() {
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showFabricAnalyzer, setShowFabricAnalyzer] = useState(false); // ✅ NEW: Fabric Analyzer modal state
  const { notify } = useNotificationSystem();
  // Load custom notification sounds from settings
  const { isLoaded: soundsLoaded } = useCustomNotificationSounds();
  
  // Track which products have been notified about to avoid duplicate notifications
  const notifiedProductsRef = useRef<Set<string>>(new Set());
  const notifiedCriticalRef = useRef<Set<string>>(new Set());
  
  // ✅ FIX: Extract items array from paginated products query response
  // ✅ UNLIMITED: Load ALL products without pagination
  // Using new getAllProducts query to bypass Convex default 20-item limit
  const products = useQuery(api.products.getAllProducts, {}) || [];
  const salesData = useQuery(api.sales.list, {});
  const sales = Array.isArray(salesData) ? salesData : [];
  const categoriesData = useQuery(api.categories.list);
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const customersData = useQuery(api.customers.list, {});
  const customers = customersData?.items && Array.isArray(customersData.items) ? customersData.items : [];
  const storeSettings = useQuery(api.settings.get);
  const refundsData = useQuery(api.refunds.list, {});
  const refunds = Array.isArray(refundsData) ? refundsData : [];
  
  const { isOnline, isSyncing } = useOfflineSync();
  
  // Check if data is still loading - check if queries are undefined (loading state)
  const isLoading = products === undefined || !sales;

  // Calculate stats - only when data is available
  const totalProducts = products?.length || 0;
  
  // ✅ Debug: Log product loading
  useEffect(() => {
    console.log('📦 Dashboard - Products loaded:', totalProducts, 'items');
    if (totalProducts > 0) {
      console.log('✅ First product:', products[0]?.name, 'Stock:', products[0]?.currentStock);
      console.log('✅ Last product:', products[totalProducts-1]?.name, 'Stock:', products[totalProducts-1]?.currentStock);
    }
  }, [totalProducts, products]);
  const totalAbayas = products?.reduce((sum, product) => sum + product.currentStock, 0) || 0;
  const lowStockProducts = products?.filter(p => p.currentStock <= p.minStockLevel) || [];
  const totalValue = products?.reduce((sum, product) => 
    sum + (product.sellingPrice * product.currentStock), 0) || 0;

  // Recent sales (last 7 days)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentSales = Array.isArray(sales) ? sales.filter(sale => sale._creationTime >= sevenDaysAgo) : [];
  const totalRecentSales = Array.isArray(recentSales) ? recentSales.reduce((sum, sale) => sum + sale.total, 0) : 0;

  // Today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSales = Array.isArray(sales) ? sales.filter(sale => sale._creationTime >= today.getTime()) : [];
  const todayTotal = Array.isArray(todaysSales) ? todaysSales.reduce((sum, sale) => sum + sale.total, 0) : 0;

  // Refund statistics
  const totalRefunds = refunds?.length || 0;
  const totalRefundAmount = refunds?.reduce((sum, r) => sum + r.refundAmount, 0) || 0;
  const pendingRefunds = refunds?.filter(r => r.approvalStatus === "pending_approval") || [];
  const completedRefunds = refunds?.filter(r => r.status === "completed") || [];
  const refundRate = (sales?.length || 0) > 0 ? (((refunds?.length || 0) / (sales?.length || 0)) * 100).toFixed(1) : "0";

  // Top selling products
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  
  if (Array.isArray(sales)) {
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const existing = productSales.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.totalPrice;
      productSales.set(item.productId, existing);
    });
  });
  }

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Monitor and trigger notifications (only once per product)
  useEffect(() => {
    // Check for low stock - only notify once per product
    lowStockProducts.forEach(product => {
      if (!notifiedProductsRef.current.has(product._id)) {
        notify({
          ...NotificationPresets.lowStock(product.name, product.currentStock),
        });
        notifiedProductsRef.current.add(product._id);
      }
    });

    // Remove products that are no longer low stock from tracking
    const lowStockIds = new Set(lowStockProducts.map(p => p._id));
    notifiedProductsRef.current = new Set(
      Array.from(notifiedProductsRef.current).filter(id => lowStockIds.has(id))
    );

    // Check for critical inventory - only notify once per product
    const criticalProducts = products.filter(p => p.currentStock <= 5);
    if (criticalProducts.length > 0) {
      const criticalProduct = criticalProducts[0];
      if (!notifiedCriticalRef.current.has(criticalProduct._id)) {
        notify({
          ...NotificationPresets.criticalInventory(criticalProduct.name),
        });
        notifiedCriticalRef.current.add(criticalProduct._id);
      }
    }

    // Remove products that are no longer critical from tracking
    const criticalIds = new Set(criticalProducts.map(p => p._id));
    notifiedCriticalRef.current = new Set(
      Array.from(notifiedCriticalRef.current).filter(id => criticalIds.has(id))
    );

    // Check today's sales performance - only notify once
    if (todayTotal > 0) {
      notify({
        ...NotificationPresets.saleSuccess(todayTotal),
        duration: 3000,
      });
    }
  }, [products, todayTotal, lowStockProducts]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Online/Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-lg">📴</span>
            <span className="text-yellow-800 font-medium">
              {isSyncing ? "🔄 Syncing..." : "Offline - cached data"}
            </span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border border-purple-300 shadow-md overflow-hidden">
                {storeSettings?.logo ? (
                  <img src={storeSettings.logo} alt="Logo" className="w-6 h-6 sm:w-10 sm:h-10 object-contain" />
                ) : (
                  <img src="/LOGO2.png" alt="Dubai Borka House" className="w-6 h-6 sm:w-10 sm:h-10 object-contain" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                  {(storeSettings?.storeTitle || "DUBAI BORKA HOUSE").split(" ")[0]}
                </h1>
                <p className="hidden sm:block text-xs text-slate-500 truncate">{storeSettings?.tagline || "Management System"}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
              <span className="text-xs sm:text-sm text-slate-500">📅</span>
              <span className="text-xs sm:text-sm font-medium text-slate-700">{new Date().toLocaleDateString('en-BD')}</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Notification Button */}
              <button
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition relative"
                title="সূচনা এবং সতর্কতা"
              >
                <NotificationIcon />
              </button>

              {isOnline ? (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-green-50 rounded text-green-700 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="hidden sm:inline font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-yellow-50 rounded text-yellow-700 text-xs">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline font-medium">Offline</span>
                </div>
              )}
              <div className="text-xs text-slate-600">
                {new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 w-full max-w-screen-2xl mx-auto">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Metrics Row 1: Responsive Grid - Show skeletons while loading */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {isLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                {/* Card 1: Total Bundles */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Bundles</p>
                      <p className="text-2xl sm:text-4xl font-bold text-slate-900">{totalProducts}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">📦</div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">In inventory</p>
                </div>

                {/* Card 2: In Stock */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">In Stock</p>
                      <p className="text-2xl sm:text-4xl font-bold text-slate-900">{totalAbayas}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">👗</div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">Ready sale</p>
                </div>

                {/* Card 3: Low Stock Items */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Low</p>
                      <p className="text-2xl sm:text-4xl font-bold text-slate-900">{lowStockProducts.length}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-yellow-100 border border-yellow-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">⚠️</div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">Restock</p>
                </div>

                {/* Card 4: Inventory Value */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Value</p>
                      <p className="text-2xl sm:text-4xl font-bold text-slate-900">৳{(totalValue / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">💰</div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">Stock worth</p>
                </div>
              </>
            )}
          </div>

          {/* Sales Section: Responsive Cards - Show skeletons while loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {isLoading ? (
              <>
                <SalesCardSkeleton />
                <SalesCardSkeleton />
              </>
            ) : (
            <>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">💵</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Sales Overview</h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {/* Today's Sales */}
                <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                    <p className="text-xs font-semibold text-green-700 uppercase">Today</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-900 text-right">৳{todayTotal.toLocaleString('en-BD')}</p>
                  </div>
                  <p className="text-xs text-green-700">{todaysSales.length} txn</p>
                </div>

                {/* Last 7 Days */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg p-3 sm:p-4 border border-blue-200">
                  <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                    <p className="text-xs font-semibold text-blue-700 uppercase">7 Days</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900 text-right">৳{totalRecentSales.toLocaleString('en-BD')}</p>
                  </div>
                  <p className="text-xs text-blue-700">{recentSales.length} txn</p>
                </div>

                {/* Total Sales */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg p-3 sm:p-4 border border-purple-200">
                  <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                    <p className="text-xs font-semibold text-purple-700 uppercase">Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-900 text-right">৳{Array.isArray(sales) ? sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString('en-BD') : '0'}</p>
                  </div>
                  <p className="text-xs text-purple-700">{sales.length} txn</p>
                </div>
              </div>
            </div>

            {/* Top Products Card */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🏆</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Top Products</h3>
              </div>

              <div className="space-y-2">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-slate-600">{product.quantity} sold</p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 flex-shrink-0">৳{(product.revenue / 1000).toFixed(0)}K</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-6 text-sm">No data</p>
                )}
              </div>
            </div>
              </>
            )}
          </div>

          {/* Metrics Row 2: 5 Cards (Mobile: 2x3 Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
            {/* Total Customers */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Customers</p>
                  <p className="text-2xl sm:text-4xl font-bold text-slate-900">{customers.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">👥</div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Registered</p>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Categories</p>
                  <p className="text-2xl sm:text-4xl font-bold text-slate-900">{categories.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">📂</div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Types</p>
            </div>

            {/* Average Sale Value */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Avg Sale</p>
                  <p className="text-2xl sm:text-4xl font-bold text-slate-900">৳{Array.isArray(sales) && sales.length > 0 ? Math.round(sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length).toLocaleString('en-BD') : '0'}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">📈</div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Per txn</p>
            </div>

            {/* Stock Turnover */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Turnover</p>
                  <p className="text-2xl sm:text-4xl font-bold text-slate-900">{totalAbayas > 0 && Array.isArray(sales) ? Math.round((sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0) / totalAbayas) * 100) : 0}%</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">🔄</div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Rate</p>
            </div>

            {/* Refund Management Card */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-3 sm:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">Refunds</p>
                  <p className="text-2xl sm:text-4xl font-bold text-slate-900">{totalRefunds}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">🔄</div>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-slate-600">৳{(totalRefundAmount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-slate-500">{refundRate}% rate</p>
              </div>
            </div>
          </div>

          {/* Low Stock Alert & Refund Status - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-red-200 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                  <span className="text-xl sm:text-2xl animate-pulse">⚠️</span>
                  <h3 className="text-base sm:text-lg font-bold text-red-900">Low Stock</h3>
                  <span className="ml-auto inline-block px-2.5 sm:px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    {lowStockProducts.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">{lowStockProducts.length} item(s) need restock</p>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 4).map((product) => (
                    <div key={product._id} className="bg-red-50 rounded-lg p-2.5 sm:p-3 border border-red-200">
                      <p className="text-xs sm:text-sm font-semibold text-red-900 truncate">{product.name}</p>
                      <p className="text-xs text-red-700 mt-1">Stock: {product.currentStock} / Min: {product.minStockLevel}</p>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 4 && (
                  <p className="text-xs text-red-700 mt-3 sm:mt-4 font-medium">+{lowStockProducts.length - 4} more</p>
                )}
              </div>
            )}

            {/* Refund Status Card */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🔄</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Refund Status</h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {/* Pending Approvals */}
                <div className={`rounded-lg p-3 sm:p-4 border ${pendingRefunds.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                    <p className={`text-xs font-semibold uppercase ${pendingRefunds.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                      Pending
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${pendingRefunds.length > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                      {pendingRefunds.length}
                    </p>
                  </div>
                  {pendingRefunds.length > 0 && (
                    <p className={`text-xs sm:text-sm ${pendingRefunds.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                      Action needed
                    </p>
                  )}
                </div>

                {/* Completed Refunds */}
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-green-700 uppercase">Completed Refunds</p>
                    <p className="text-2xl font-bold text-green-900">{completedRefunds.length}</p>
                  </div>
                  <p className="text-sm text-green-700">Processed successfully</p>
                </div>

                {/* Total Refund Amount */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-blue-700 uppercase">Total Refunded</p>
                    <p className="text-2xl font-bold text-blue-900">৳{totalRefundAmount.toLocaleString('en-BD')}</p>
                  </div>
                  <p className="text-sm text-blue-700">Refund rate: {refundRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sales Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🕒</span>
              <h3 className="text-lg font-bold text-slate-900">Recent Sales Activity</h3>
            </div>

            <div className="space-y-2">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">Sale #{sale.saleNumber}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {sale.customerName || 'Walk-in'} • {new Date(sale._creationTime).toLocaleDateString('en-BD')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-slate-900">৳{sale.total.toLocaleString('en-BD')}</p>
                    <p className="text-xs text-slate-600">{sale.items.length} items</p>
                  </div>
                </div>
              ))}
              {sales.length === 0 && (
                <p className="text-center text-slate-400 py-8">No recent sales</p>
              )}
            </div>
          </div>

          {/* Dashboard Alerts Summary */}
          <DashboardAlertsSummary />

          {/* ✅ NEW: Fabric Analyzer Tools Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-2xl sm:text-3xl">🧵</span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Fabric Analyzer</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">Analyze fabric properties from uploaded images instantly</p>
              </div>
              <button
                onClick={() => setShowFabricAnalyzer(true)}
                className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm whitespace-nowrap"
                title="Open Fabric Analyzer Tool"
              >
                <span>📸</span>
                <span>Open Analyzer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white rounded-lg p-2 sm:p-3 border border-amber-100">
                <p className="text-xs font-semibold text-amber-600 mb-1">📋 What it detects:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ Fabric type (Crepe, Chiffon, etc.)</li>
                  <li>✓ Color & embellishments</li>
                  <li>✓ Craftsmanship details</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 border border-amber-100">
                <p className="text-xs font-semibold text-amber-600 mb-1">🎯 How to use:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>1. Click "Open Analyzer"</li>
                  <li>2. Upload fabric image</li>
                  <li>3. View analysis results</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 border border-amber-100">
                <p className="text-xs font-semibold text-amber-600 mb-1">💡 Use case:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>✓ Add new products</li>
                  <li>✓ Verify product details</li>
                  <li>✓ Quality control</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 🔧 DEVELOPMENT: Diagnostic Panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <div className="font-bold text-yellow-900 mb-2">🔧 DIAGNOSTIC INFO (DEV ONLY)</div>
            <div className="text-sm text-yellow-800 space-y-1 font-mono">
              <div>📦 Products loaded: <span className={totalProducts > 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>{totalProducts}</span></div>
              <div>💾 Products array: <span className={Array.isArray(products) ? "text-green-700" : "text-red-700"}>{Array.isArray(products) ? "✅ Is Array" : "❌ Not Array"}</span></div>
              <div>📝 Array length: <span>{products?.length || 0}</span></div>
              <div>🏷️ First product: <span>{products[0]?.name || "❌ EMPTY"}</span></div>
              <div>📊 First product stock: <span>{products[0]?.currentStock || 0}</span></div>
              <div>💰 Total stock value: ৳{totalValue.toLocaleString('en-BD')}</div>
              <div>⚠️ Low stock items: {lowStockProducts.length}</div>
              <div>👥 Customers: {customers.length}</div>
              <div>📂 Categories: {categories.length}</div>
              <div>📌 Is Loading: {isLoading ? "🟡 YES" : "🟢 NO"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Panel */}
      <NotificationAlertsPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)}
      />

      {/* ✅ NEW: Fabric Analyzer Modal */}
      {showFabricAnalyzer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 sm:p-6 flex items-center justify-between border-b border-amber-700">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl flex-shrink-0">🧵</span>
                <h2 className="text-lg sm:text-2xl font-bold truncate">Fabric Analyzer</h2>
              </div>
              <button
                onClick={() => setShowFabricAnalyzer(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors text-xl sm:text-2xl flex-shrink-0"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <FabricAnalyzer />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
