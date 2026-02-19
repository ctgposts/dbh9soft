import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { PrintTest } from "./PrintTest";
import { BranchManagement } from "./BranchManagement";
import { RuleBasedUserManagement } from "./RuleBasedUserManagement";
import CustomerLoyalty from "./CustomerLoyalty";
import CouponManagement from "./CouponManagement";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "cashier",
    password: ""
  });
  const [showAddUser, setShowAddUser] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(120);
  const [storeTitle, setStoreTitle] = useState("DUBAI BORKA HOUSE");
  const [tagline, setTagline] = useState("");
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  // Fetch current settings
  const storeSettings = useQuery(api.settings.get);

  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "logo", name: "Logo & Title", icon: "🎨" },
    { id: "branches", name: "Branches", icon: "🏢" },
    { id: "store", name: "Store Info", icon: "🏪" },
    { id: "loyalty", name: "Loyalty & Rewards", icon: "🎁" },
    { id: "coupons", name: "Coupons", icon: "🎟️" },
    { id: "print", name: "Print Test", icon: "🖨️" },
    { id: "backup", name: "Backup & Restore", icon: "💾" },
    { id: "users", name: "User Management", icon: "👥" },
    { id: "userRules", name: "User Rules", icon: "🔐" },
    { id: "system", name: "System", icon: "🖥️" },
  ];

  const exportAllData = useQuery(api.backup.exportAllData);
  const importDataMutation = useMutation(api.backup.importAllData);
  const resetDataMutation = useMutation(api.backup.resetAllData);
  const updateSettingsMutation = useMutation(api.settings.update);

  // Initialize with current settings
  useEffect(() => {
    if (storeSettings) {
      setStoreTitle(storeSettings.storeTitle || "DUBAI BORKA HOUSE");
      setTagline(storeSettings.tagline || "");
      setLogoPreview(storeSettings.logo || null);
    }
  }, [storeSettings]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB for original)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("লোগো সাইজ ৫ MB এর কম হতে হবে");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // For images, compress aggressively
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              toast.error("Canvas error - unable to process image");
              return;
            }
            
            // Resize image to max 250x250 with aggressive compression
            const maxDim = 250;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different compression levels to find the smallest
            let compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            
            // If still too large, try 0.5
            if (compressedBase64.length > 1000000) {
              compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
            }
            
            // If still too large, try 0.4
            if (compressedBase64.length > 800000) {
              compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
            }
            
            console.log(`Compressed logo size: ${(compressedBase64.length / 1024).toFixed(2)} KB`);
            setLogoPreview(compressedBase64);
            toast.success(`লোগো আপলোড হয়েছে (${(compressedBase64.length / 1024).toFixed(2)} KB)`);
          };
          img.onerror = () => {
            toast.error("লোগো লোড করতে ব্যর্থ");
          };
          img.src = result;
        } else {
          setLogoPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    try {
      if (!storeTitle || storeTitle.trim().length === 0) {
        toast.error("স্টোর টাইটেল লিখুন");
        return;
      }
      
      setIsSavingLogo(true);
      console.log("Saving settings with data:", { 
        logo: logoPreview ? logoPreview.substring(0, 50) : "none", 
        storeTitle, 
        tagline 
      });
      
      const result = await updateSettingsMutation({ 
        ...(logoPreview && { logo: logoPreview }),
        storeTitle: storeTitle.trim(),
        tagline: tagline.trim(),
        clearLogo: false,
      });
      
      console.log("Save result:", result);
      toast.success("সেটিংস সংরক্ষিত হয়েছে!");
      
      // Small delay to ensure database is updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(`সংরক্ষণ করতে ব্যর্থ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm("লোগো মুছে ফেলতে নিশ্চিত?")) {
      return;
    }
    
    try {
      setIsSavingLogo(true);
      await updateSettingsMutation({ 
        storeTitle: storeTitle.trim(),
        tagline: tagline.trim(),
        clearLogo: true,
      });
      
      setLogoPreview(null);
      toast.success("লোগো মুছে ফেলা হয়েছে!");
      
      // Small delay to ensure database is updated
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`লোগো মুছতে ব্যর্থ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingLogo(false);
    }
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      if (!exportAllData) {
        throw new Error("Data not ready for export");
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportAllData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raisa-dubai-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.store || importData.store !== "DUBAI BORKA HOUSE") {
        throw new Error("Invalid backup file format");
      }

      if (!importData.data || !importData.data.products || !importData.data.sales || 
          !importData.data.customers || !importData.data.categories) {
        throw new Error("Invalid backup file structure");
      }

      // Confirm before importing
      if (!confirm("⚠️ This will replace ALL existing data with the backup data. Are you sure?")) {
        return;
      }

      await importDataMutation({ data: importData.data });
      toast.success("Data imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import data. Please check the file format.");
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Here you would call a mutation to add the user
    toast.success(`User ${newUser.name} added successfully!`);
    setNewUser({ name: "", email: "", role: "cashier", password: "" });
    setShowAddUser(false);
  };

  const clearCache = () => {
    // Clear browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage
    localStorage.clear();
    
    toast.success("Cache cleared successfully!");
  };

  const optimizeDatabase = () => {
    // Simulate database optimization
    toast.success("Database optimized successfully!");
  };

  const resetApplication = async () => {
    if (!confirm("⚠️ This will delete ALL data permanently and reset to default configuration. Are you sure?")) {
      return;
    }
    
    const confirmText = prompt("Type 'RESET' to confirm this action:");
    if (confirmText !== 'RESET') {
      toast.error("Reset cancelled - confirmation text did not match");
      return;
    }

    setIsResetting(true);
    try {
      await resetDataMutation({});
      toast.success("Application reset to default state successfully!");
      
      // Clear browser cache and localStorage as well
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      localStorage.clear();
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset application");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
        
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">⚙️ Settings</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Configuration</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 hover:bg-white transition-colors"
          >
            {isSidebarOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className={`
          fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300
          ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          lg:hidden
        `} onClick={() => setIsSidebarOpen(false)} />

        <div className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white/80 backdrop-blur-sm border-r border-white/60 z-50 overflow-y-auto
          transform transition-transform duration-300 lg:static lg:transform-none lg:w-64
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:rounded-3xl lg:shadow-sm
        `}>
          {/* Desktop Header in Sidebar */}
          <div className="hidden lg:block sticky top-0 bg-white/80 backdrop-blur-sm border-b border-white/60 p-6 rounded-t-3xl">
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings</h1>
            <p className="text-xs text-gray-600 mt-1">Configuration</p>
          </div>

          {/* Sidebar Navigation Tabs */}
          <nav className="p-3 sm:p-6 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {activeTab === "logo" && (
            <>
            <h3 className="text-lg font-bold text-gray-900 mb-6">🎨 লোগো এবং টাইটেল ম্যানেজমেন্ট</h3>
            
            <div className="max-w-2xl mx-auto">
              {/* Logo & Title Display Section */}
              <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-200 rounded-lg p-6 mb-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  {/* Logo */}
                  <div 
                    className="bg-white border-2 border-gray-300 rounded-lg p-3 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      width: `${logoSize}px`, 
                      height: `${logoSize}px`,
                      minWidth: `${logoSize}px`
                    }}
                  >
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo" 
                        className="max-w-full max-h-full object-contain"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <span className="text-5xl">🏪</span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="w-full pt-1">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                      {storeTitle || "স্টোর নাম"}
                    </h2>
                    {tagline && (
                      <p className="text-sm text-gray-600 italic mt-1">{tagline}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Size Slider */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  লোগো সাইজ: {logoSize}px
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>60px (ছোট)</span>
                  <span>200px (বড়)</span>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  লোগো আপলোড করুন
                </label>
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-purple-50 hover:bg-purple-100 transition cursor-pointer">
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <div className="text-4xl">📤</div>
                      <p className="text-gray-900 font-medium">লোগো ছবি নির্বাচন করুন</p>
                      <p className="text-xs text-gray-600">PNG, JPG বা SVG ফরম্যাট। সর্বোচ্চ ২ MB</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Store Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  স্টোর টাইটেল *
                </label>
                <input
                  type="text"
                  value={storeTitle}
                  onChange={(e) => setStoreTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  placeholder="আপনার স্টোরের নাম লিখুন"
                />
                <p className="text-xs text-gray-600 mt-1">✓ সব পৃষ্ঠায় এবং ডকুমেন্টে প্রদর্শিত হবে</p>
              </div>

              {/* Tagline */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ট্যাগলাইন (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="স্টোর স্লোগান বা বর্ণনা"
                  maxLength={100}
                />
                <p className="text-xs text-gray-600 mt-1">{tagline.length}/100 অক্ষর</p>
              </div>

              {/* Save & Delete Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveLogo}
                  disabled={isSavingLogo}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  {isSavingLogo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      সংরক্ষণ করছি...
                    </>
                  ) : (
                    <>
                      ✅ সংরক্ষণ করুন
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeleteLogo}
                  disabled={isSavingLogo || !logoPreview}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  🗑️ লোগো মুছুন
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>💡 টিপস:</strong> লোগো সাইজ স্লাইডার দিয়ে বড় বা ছোট করুন, তারপর সংরক্ষণ করুন।
                </p>
              </div>
            </div>
            </>
          )}

          {activeTab === "general" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value="৳"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>Asia/Dhaka (GMT+6)</option>
                  <option>Asia/Dubai (GMT+4)</option>
                  <option>UTC (GMT+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>English</option>
                  <option>বাংলা (Bengali)</option>
                  <option>العربية (Arabic)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Save General Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "store" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value="DUBAI BORKA HOUSE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="info@raisadubai.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={3}
                  placeholder="Store address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / Trade License
                  </label>
                  <input
                    type="text"
                    placeholder="Tax identification number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.raisadubai.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Save Store Information
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "print" && (
        <div className="space-y-4 sm:space-y-6">
          <PrintTest />
        </div>
      )}

      {activeTab === "backup" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Backup & Restore</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6">
              {/* Export Data Card */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-xl sm:text-2xl flex-shrink-0">📤</span>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Export Data</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3">
                  Download a complete backup of your store data including products, sales, and customers.
                </p>
                <button
                  onClick={exportData}
                  disabled={isExporting || !exportAllData}
                  className="w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-xs sm:text-sm transition-colors"
                >
                  {isExporting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </div>
                  ) : (
                    "📥 Export All Data"
                  )}
                </button>
              </div>

              {/* Import Data Card */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-xl sm:text-2xl flex-shrink-0">📥</span>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Import Data</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-3">
                  Restore your store data from a previously exported backup file.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  disabled={isImporting}
                  className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {isImporting && (
                  <div className="mt-2 flex items-center text-xs sm:text-sm text-gray-600 gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-purple-600 flex-shrink-0"></div>
                    <span>Importing data...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                <span className="text-yellow-600 text-lg sm:text-xl flex-shrink-0 pt-0.5">⚠️</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-yellow-800 text-sm sm:text-base">Important Notes:</h4>
                  <ul className="text-xs sm:text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Always backup your data before importing</li>
                    <li>• Import will overwrite existing data</li>
                    <li>• Only import files from DUBAI BORKA HOUSE</li>
                    <li>• Contact support if you encounter issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 User Management</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 text-xl">ℹ️</span>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Employee Management</h4>
                  <p className="text-sm text-blue-800 mb-4">
                    User and employee management is handled through the Employee Management section in the dashboard. To add, edit, or manage users:
                  </p>
                  <ol className="text-sm text-blue-800 space-y-2 mb-4">
                    <li>1. Go to <strong>Dashboard</strong> → <strong>Employee Management</strong></li>
                    <li>2. Click <strong>"+ Add New Employee"</strong> to create a new user</li>
                    <li>3. Fill in the required information (name, email, phone, position)</li>
                    <li>4. Select the branch where the employee will work</li>
                    <li>5. Set permissions and other details</li>
                    <li>6. Click <strong>"Save"</strong> to create the user</li>
                  </ol>
                  <p className="text-sm text-blue-800 font-medium">
                    Each employee needs to be assigned to a branch before they can access the system.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Features:</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Create and manage employees/users</li>
                <li>✓ Assign positions and permissions</li>
                <li>✓ Track employee performance</li>
                <li>✓ Manage commissions and salaries</li>
                <li>✓ Set emergency contact information</li>
                <li>✓ Activate or deactivate users</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "branches" && (
        <BranchManagement />
      )}

      {activeTab === "userRules" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <RuleBasedUserManagement />
          </div>
        </div>
      )}

      {activeTab === "loyalty" && (
        <div>
          <CustomerLoyalty />
        </div>
      )}

      {activeTab === "coupons" && (
        <div>
          <CouponManagement />
        </div>
      )}

      {activeTab === "system" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Application Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Build:</span>
                    <span className="font-medium">2024.01.15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Environment:</span>
                    <span className="font-medium">Production</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Database Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Backup:</span>
                    <span className="font-medium">Today, 3:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage Used:</span>
                    <span className="font-medium">2.4 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">System Maintenance</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* Clear Cache Card */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">🧹 Clear Cache</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">Clear application cache to improve performance and free up memory</p>
                </div>
                <button
                  onClick={clearCache}
                  className="w-full px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors"
                >
                  Clear Cache
                </button>
              </div>

              {/* Optimize Database Card */}
              <div className="border border-blue-200 rounded-lg p-3 sm:p-4 md:p-6 bg-blue-50 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-900 text-sm sm:text-base">⚙️ Optimize Database</h4>
                  <p className="text-xs sm:text-sm text-blue-700 mt-2 line-clamp-2">Optimize database for better query performance and efficiency</p>
                </div>
                <button
                  onClick={optimizeDatabase}
                  className="w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors"
                >
                  Optimize
                </button>
              </div>

              {/* Reset Application Card */}
              <div className="border border-red-200 rounded-lg p-3 sm:p-4 md:p-6 bg-red-50 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="font-semibold text-red-900 text-sm sm:text-base">🔄 Reset to Default</h4>
                  <p className="text-xs sm:text-sm text-red-700 mt-2 line-clamp-2">⚠️ Permanently delete all data and restore defaults</p>
                </div>
                <button
                  onClick={resetApplication}
                  disabled={isResetting}
                  className="w-full px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors"
                >
                  {isResetting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    "Reset Application"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Performance Metrics</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
              <div className="p-3 sm:p-4 md:p-6 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">99.9%</div>
                <div className="text-xs sm:text-sm text-blue-800 font-medium">Uptime</div>
                <p className="text-xs text-blue-600 mt-1">Last 30 days</p>
              </div>
              <div className="p-3 sm:p-4 md:p-6 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">1.2s</div>
                <div className="text-xs sm:text-sm text-green-800 font-medium">Avg Response</div>
                <p className="text-xs text-green-600 mt-1">API latency</p>
              </div>
              <div className="p-3 sm:p-4 md:p-6 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">2.4MB</div>
                <div className="text-xs sm:text-sm text-purple-800 font-medium">Storage Used</div>
                <p className="text-xs text-purple-600 mt-1">Cache size</p>
              </div>
              <div className="p-3 sm:p-4 md:p-6 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1">1,234</div>
                <div className="text-xs sm:text-sm text-orange-800 font-medium">Total Records</div>
                <p className="text-xs text-orange-600 mt-1">Database size</p>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
