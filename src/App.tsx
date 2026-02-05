import { useState, lazy, Suspense, useEffect, useCallback, useMemo } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { LoginWrapper } from "./components/LoginWrapper";
import { SignOutButton } from "./SignOutButton";
import { Dashboard } from "./components/Dashboard";
import { LazyLoadingFallback, preloadComponents } from "./utils/lazyLoad";
import { registerServiceWorkerCacheHandlers } from "./utils/cacheService";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { useSystemInitialization } from "./hooks/useSystemInitialization";

// Lazy load heavy components
const Inventory = lazy(() => import("./components/Inventory"));
const POS = lazy(() => import("./components/POS"));
const EnhancedPOS = lazy(() => import("./components/EnhancedPOS"));
const Sales = lazy(() => import("./components/Sales"));
const Customers = lazy(() => import("./components/Customers"));
const Suppliers = lazy(() => import("./components/Suppliers"));
const PurchaseReceiving = lazy(() => import("./components/PurchaseReceiving"));
const BarcodeManager = lazy(() => import("./components/BarcodeManager"));
const Reports = lazy(() => import("./components/Reports"));
const Settings = lazy(() => import("./components/Settings"));
const Categories = lazy(() => import("./components/Categories"));
const EmployeeManagement = lazy(() => import("./components/EmployeeManagement"));
const DiscountManagement = lazy(() => import("./components/DiscountManagement"));
const WhatsAppOrders = lazy(() => import("./components/WhatsAppOrders"));
const OnlineStore = lazy(() => import("./components/OnlineStore"));
const StockTransferManagement = lazy(() => import("./components/StockTransferManagement"));
const StockManagement = lazy(() => import("./components/StockManagement"));
const OutstandingAmount = lazy(() => import("./components/OutstandingAmount"));
const HRPayroll = lazy(() => import("./components/HRPayroll"));
const UserManagement = lazy(() => import("./components/UserManagement"));
const RefundManagement = lazy(() => import("./components/RefundManagement"));
const StaffProductPortal = lazy(() => import("./components/StaffPortal").then(m => ({ default: m.StaffProductPortal })));
const ProductImageRecognition = lazy(() => import("./components/StaffPortal/ProductImageRecognition"));

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Initialize offline sync
  const { isOnline } = useOfflineSync();
  
  // Initialize system with default roles
  const { initialized, isInitializing, rolesCount } = useSystemInitialization();
  
  // Initialize Service Worker and caching
  useEffect(() => {
    // Register service worker (non-critical for app function)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("✅ Service Worker registered successfully");
        })
        .catch((error) => {
          // Service Worker failures are non-critical - app works fine without it
          console.debug("Service Worker registration skipped (offline features unavailable):", error.message);
        });
    }

    // Register cache handlers
    registerServiceWorkerCacheHandlers();

    // Preload main components for faster navigation
    const preloadList = [
      () => import("./components/POS"),
      () => import("./components/Inventory"),
      () => import("./components/Sales"),
      () => import("./components/Reports"),
      () => import("./components/Customers"),
      () => import("./components/EmployeeManagement"),
      () => import("./components/BarcodeManager"),
    ];

    // Delay preloading to avoid blocking initial render
    const timer = setTimeout(() => {
      preloadComponents(preloadList).catch(console.error);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  
  // Fetch store settings
  const storeSettings = useQuery(api.settings.get);

  // Memoize menu items to prevent unnecessary recalculations
  const desktopMenuItems = useMemo(() => [
    { id: "dashboard", name: "Dashboard", icon: "📊" },
    { id: "staff-portal", name: "Staff Portal", icon: "👨‍💼" },
    { id: "product-recognition", name: "Product Scanner", icon: "📸" },
    { id: "pos", name: "POS", icon: "🏷️" },
    { id: "inventory", name: "Inventory", icon: "📦" },
    { id: "categories", name: "Categories", icon: "📂" },
    { id: "stock-management", name: "Stock Mgmt", icon: "🏭" },
    { id: "stock-transfer", name: "Stock Transfer", icon: "🔄" },
    { id: "sales", name: "Sales", icon: "💰" },
    { id: "customers", name: "Customers", icon: "👥" },
    { id: "outstanding", name: "Outstanding", icon: "💸" },
    { id: "refunds", name: "Refunds", icon: "↩️" },
    { id: "hr", name: "HR & Payroll", icon: "👔" },
    { id: "employees", name: "Employees", icon: "👔" },
    { id: "discounts", name: "Discounts", icon: "🎁" },
    { id: "whatsapp", name: "WhatsApp", icon: "📱" },
    { id: "online", name: "Online Store", icon: "🌐" },
    { id: "barcodes", name: "Barcodes", icon: "🏷️" },
    { id: "users", name: "User Management", icon: "👥" },
    { id: "reports", name: "Reports", icon: "📈" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ], []);

  // Mobile bottom navigation items (4 main items)
  const mobileBottomNavItems = useMemo(() => [
    { id: "dashboard", name: "Dashboard", icon: "📊" },
    { id: "pos", name: "POS", icon: "🏷️" },
    { id: "inventory", name: "Inventory", icon: "📦" },
    { id: "sales", name: "Sales", icon: "💰" },
  ], []);

  // Mobile menu items (accessible via hamburger menu)
  const mobileMenuItems = useMemo(() => [
    { id: "dashboard", name: "Dashboard", icon: "📊" },
    { id: "staff-portal", name: "Staff Portal", icon: "👨‍💼" },
    { id: "product-recognition", name: "Product Scanner", icon: "📸" },
    { id: "pos", name: "POS", icon: "🏷️" },
    { id: "inventory", name: "Inventory", icon: "📦" },
    { id: "categories", name: "Categories", icon: "📂" },
    { id: "stock-management", name: "Stock Mgmt", icon: "🏭" },
    { id: "stock-transfer", name: "Stock Transfer", icon: "🔄" },
    { id: "sales", name: "Sales", icon: "💰" },
    { id: "customers", name: "Customers", icon: "👥" },
    { id: "outstanding", name: "Outstanding", icon: "💸" },
    { id: "refunds", name: "Refunds", icon: "↩️" },
    { id: "employees", name: "Employees", icon: "👔" },
    { id: "discounts", name: "Discounts", icon: "🎁" },
    { id: "whatsapp", name: "WhatsApp", icon: "📱" },
    { id: "online", name: "Online Store", icon: "🌐" },
    { id: "barcodes", name: "Barcodes", icon: "🏷️" },
    { id: "users", name: "User Management", icon: "👥" },
    { id: "reports", name: "Reports", icon: "📈" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ], []);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "staff-portal":
        return <Suspense fallback={<LazyLoadingFallback />}><StaffProductPortal /></Suspense>;
      case "product-recognition":
        return <Suspense fallback={<LazyLoadingFallback />}><ProductImageRecognition /></Suspense>;
      case "inventory":
        return <Suspense fallback={<LazyLoadingFallback />}><Inventory /></Suspense>;
      case "categories":
        return <Suspense fallback={<LazyLoadingFallback />}><Categories /></Suspense>;
      case "stock-management":
        return <Suspense fallback={<LazyLoadingFallback />}><StockManagement /></Suspense>;
      case "stock-transfer":
        return <Suspense fallback={<LazyLoadingFallback />}><StockTransferManagement /></Suspense>;
      case "pos":
        return <Suspense fallback={<LazyLoadingFallback />}><POS /></Suspense>;
      case "enhanced-pos":
        return <Suspense fallback={<LazyLoadingFallback />}><EnhancedPOS /></Suspense>;
      case "sales":
        return <Suspense fallback={<LazyLoadingFallback />}><Sales /></Suspense>;
      case "refunds":
        return <Suspense fallback={<LazyLoadingFallback />}><RefundManagement /></Suspense>;
      case "customers":
        return <Suspense fallback={<LazyLoadingFallback />}><Customers /></Suspense>;
      case "outstanding":
        return <Suspense fallback={<LazyLoadingFallback />}><OutstandingAmount /></Suspense>;
      case "hr":
        return <Suspense fallback={<LazyLoadingFallback />}><HRPayroll /></Suspense>;
      case "employees":
        return <Suspense fallback={<LazyLoadingFallback />}><EmployeeManagement /></Suspense>;
      case "users":
        return <Suspense fallback={<LazyLoadingFallback />}><UserManagement /></Suspense>;
      case "discounts":
        return <Suspense fallback={<LazyLoadingFallback />}><DiscountManagement /></Suspense>;
      case "whatsapp":
        return <Suspense fallback={<LazyLoadingFallback />}><WhatsAppOrders /></Suspense>;
      case "online":
        return <Suspense fallback={<LazyLoadingFallback />}><OnlineStore /></Suspense>;
      case "suppliers":
        return <Suspense fallback={<LazyLoadingFallback />}><Suppliers /></Suspense>;
      case "purchases":
        return <Suspense fallback={<LazyLoadingFallback />}><PurchaseReceiving /></Suspense>;
      case "barcodes":
        return <Suspense fallback={<LazyLoadingFallback />}><BarcodeManager /></Suspense>;
      case "reports":
        return <Suspense fallback={<LazyLoadingFallback />}><Reports /></Suspense>;
      case "settings":
        return <Suspense fallback={<LazyLoadingFallback />}><Settings /></Suspense>;
      default:
        return <Dashboard />;
    }
  }, [activeTab]);

  return (
    <>
      <Unauthenticated>
        <LoginWrapper />
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Mobile Header - iPhone Style */}
          <div className="lg:hidden sticky top-0 z-50 bg-gradient-to-b from-slate-900/80 via-slate-800/70 to-slate-900/60 backdrop-blur-xl border-b border-white/20 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 gap-3">
              {/* Menu Toggle - iPhone Button Style */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center text-white hover:bg-white/25 transition-all duration-300 font-bold text-lg shadow-lg backdrop-blur-md active:scale-95"
              >
                <span>☰</span>
              </button>

              {/* Logo & Store Title */}
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/40 to-blue-500/30 border border-white/25 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-md">
                  {storeSettings?.logo ? (
                    <img src={storeSettings.logo} alt="Logo" className="w-9 h-9 object-contain" />
                  ) : (
                    <img src="/LOGO2.png" alt="Dubai Borka House" className="w-9 h-9 object-contain" />
                  )}
                </div>
                <h1 className="text-base font-bold text-white truncate tracking-tight">
                  {(storeSettings?.storeTitle || "DUBAI BORKA HOUSE").split(" ")[0]}
                </h1>
              </div>

              {/* Sign Out */}
              <div className="flex-shrink-0">
                <SignOutButton />
              </div>
            </div>
          </div>

          {/* Mobile Sidebar Menu - Full Width Overlay */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40 top-16"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Mobile Menu Panel */}
              <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 z-50 bg-gradient-to-b from-slate-800/98 via-slate-800/95 to-slate-900/98 backdrop-blur-xl border-b border-white/20 shadow-2xl overflow-y-auto custom-scrollbar">
                <nav className="py-4 space-y-2 px-3">
                  {mobileMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-300 rounded-2xl font-bold text-base ${
                        activeTab === item.id 
                          ? "bg-gradient-to-r from-purple-500/50 via-blue-500/40 to-purple-500/30 text-white border border-white/40 shadow-lg shadow-purple-500/30" 
                          : "text-white/70 hover:bg-white/15 hover:text-white hover:backdrop-blur-md"
                      }`}
                    >
                      <span className={`text-2xl flex-shrink-0 transition-all duration-300 ${activeTab === item.id ? "scale-125 drop-shadow-lg" : ""}`}>{item.icon}</span>
                      <span className="font-bold text-base">{item.name}</span>
                      {activeTab === item.id && (
                        <div className="ml-auto w-3 h-3 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </>
          )}

          <div className="flex flex-col lg:flex-row flex-1">
            {/* Desktop Sidebar - iPhone Features Style */}
            <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:bg-gradient-to-b lg:from-slate-900/95 lg:via-slate-800/90 lg:to-slate-900/95 lg:border-r lg:border-white/15 lg:shadow-2xl lg:backdrop-blur-xl lg:overflow-y-auto lg:custom-scrollbar">
              {/* Logo Section - Premium Card Style */}
              <div className="flex items-center justify-center flex-shrink-0 px-6 py-8 border-b border-white/10">
                <div className="text-center w-full">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-indigo-500/40 border border-white/25 flex items-center justify-center mb-4 mx-auto shadow-2xl overflow-hidden backdrop-blur-md transform hover:scale-105 transition-transform duration-300">
                    {storeSettings?.logo ? (
                      <img src={storeSettings.logo} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                      <img src="/LOGO2.png" alt="Dubai Borka House" className="w-16 h-16 object-contain rounded-xl" />
                    )}
                  </div>
                  <h2 className="text-lg font-black text-white mb-2 tracking-tight">
                    {storeSettings?.storeTitle || "DUBAI BORKA HOUSE"}
                  </h2>
                  {storeSettings?.tagline && (
                    <p className="text-xs font-semibold text-white/60 tracking-wide">{storeSettings.tagline}</p>
                  )}
                </div>
              </div>

              {/* Navigation - iPhone Glass Morphism */}
              <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-2 custom-scrollbar">
                {desktopMenuItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left font-bold text-base ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-purple-500/50 via-blue-500/40 to-purple-500/30 text-white border border-white/40 shadow-2xl shadow-purple-500/30 backdrop-blur-xl scale-105"
                        : "text-white/75 hover:text-white hover:bg-white/12 hover:backdrop-blur-md hover:border hover:border-white/20"
                    }`}
                    style={{
                      animation: activeTab === item.id ? `glow 2s ease-in-out infinite` : "none"
                    }}
                  >
                    <span className={`text-2xl flex-shrink-0 transition-all duration-300 ${activeTab === item.id ? "scale-125 drop-shadow-lg" : "group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 font-bold text-base tracking-wide">{item.name}</span>
                    {activeTab === item.id && (
                      <div className="w-3 h-3 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse"></div>
                    )}
                  </button>
                ))}
              </nav>

              {/* Footer */}
              <div className="flex-shrink-0 border-t border-white/10 p-5 bg-gradient-to-t from-slate-900/50 to-transparent">
                <SignOutButton />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:pl-80 flex flex-col flex-1 overflow-hidden w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <main className="flex-1 overflow-auto">
                <div className="py-4 px-3 sm:py-6 sm:px-6 lg:px-8 w-full">
                  {renderContent()}
                </div>
              </main>
            </div>
          </div>

          {/* Mobile Menu Overlay Backdrop */}
        </div>
      </Authenticated>
    </>
  );
}
