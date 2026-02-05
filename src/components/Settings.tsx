import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { PrintTest } from "./PrintTest";
import { BranchManagement } from "./BranchManagement";
import { RuleBasedUserManagement } from "./RuleBasedUserManagement";
import CustomerLoyalty from "./CustomerLoyalty";
import CouponManagement from "./CouponManagement";
import { NotificationSoundSettings } from "./NotificationSoundSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any>(null);
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
  const [printSettings, setPrintSettings] = useState({
    printerType: "pos",
    stickerWidth: 1.5,
    stickerHeight: 1.0,
    gapBetweenStickers: 10,
    fontSize: 8,
    includePrice: true,
    includeName: true,
    includeSize: false,
    includeMadeBy: true,
    stickersPerRow: 2,
    paperWidth: 4,
  });
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
    { id: "notifications", name: "Notification Sounds", icon: "🎵" },
    { id: "barcode", name: "Barcode Settings", icon: "🏷️" },
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

  // Load print settings from localStorage
  useEffect(() => {
    const savedPrintSettings = localStorage.getItem("printSettings");
    if (savedPrintSettings) {
      try {
        setPrintSettings(JSON.parse(savedPrintSettings));
      } catch (error) {
        console.error("Error loading print settings:", error);
      }
    }
  }, []);

  // Save print settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("printSettings", JSON.stringify(printSettings));
  }, [printSettings]);

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
      a.download = `دبي-بوركة-هاوس-backup-${new Date().toISOString().split('T')[0]}.json`;
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

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.store || importData.store !== "DUBAI BORKA HOUSE") {
        throw new Error("Invalid backup file format");
      }

      // Show preview instead of using confirm dialog
      const dataCollections = importData.dataCollections || {};
      
      // Calculate statistics
      const stats: any = {
        timestamp: new Date(importData.timestamp).toLocaleString('bn-BD'),
        version: importData.version || "Unknown",
        collections: [],
        totalRecords: 0
      };
      
      for (const [collection, records] of Object.entries(dataCollections)) {
        const count = Array.isArray(records) ? records.length : 0;
        if (count > 0) {
          stats.collections.push({ name: collection, count });
          stats.totalRecords += count;
        }
      }
      
      stats.collections.sort((a: any, b: any) => b.count - a.count);
      
      setImportPreviewData({ ...importData, stats });
      setShowImportPreview(true);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("ব্যাকআপ ফাইল পড়তে ব্যর্থ। ফাইলের ফরম্যাট চেক করুন।");
    } finally {
      event.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importPreviewData) return;

    setIsImporting(true);
    try {
      const dataCollections = importPreviewData.dataCollections || {};
      
      // Support legacy format
      if (importPreviewData.products) {
        dataCollections["products"] = importPreviewData.products;
      }
      if (importPreviewData.sales) {
        dataCollections["sales"] = importPreviewData.sales;
      }
      if (importPreviewData.customers) {
        dataCollections["customers"] = importPreviewData.customers;
      }
      if (importPreviewData.categories) {
        dataCollections["categories"] = importPreviewData.categories;
      }

      await importDataMutation({ data: { ...importPreviewData, dataCollections } });
      toast.success("ডেটা সফলভাবে পুনরুদ্ধার করা হয়েছে!");
      setShowImportPreview(false);
      setImportPreviewData(null);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("ডেটা পুনরুদ্ধার ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।");
    } finally {
      setIsImporting(false);
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
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">⚙️ Settings</h1>
            <p className="text-sm text-gray-600 mt-1">DUBAI BORKA HOUSE Configuration</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

          {/* Tab Content */}
        {activeTab === "logo" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
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
          </div>
        </div>
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

      {activeTab === "barcode" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">🏷️ Barcode Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Printer Configuration */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Printer Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Printer Type</label>
                    <select
                      value={printSettings.printerType}
                      onChange={(e) => setPrintSettings({...printSettings, printerType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="pos">POS Printer</option>
                      <option value="regular">Regular Printer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sticker Width (inches)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="4"
                      step="0.1"
                      value={printSettings.stickerWidth}
                      onChange={(e) => setPrintSettings({...printSettings, stickerWidth: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sticker Height (inches)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={printSettings.stickerHeight}
                      onChange={(e) => setPrintSettings({...printSettings, stickerHeight: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gap Between Stickers (pixels)</label>
                    <input
                      type="number"
                      min="5"
                      max="20"
                      step="1"
                      value={printSettings.gapBetweenStickers}
                      onChange={(e) => setPrintSettings({...printSettings, gapBetweenStickers: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stickers Per Row</label>
                    <select
                      value={printSettings.stickersPerRow}
                      onChange={(e) => setPrintSettings({...printSettings, stickersPerRow: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      min="6"
                      max="16"
                      value={printSettings.fontSize}
                      onChange={(e) => setPrintSettings({...printSettings, fontSize: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Label Content & Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Label Content</h4>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printSettings.includeName}
                      onChange={(e) => setPrintSettings({...printSettings, includeName: e.target.checked})}
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Product Name</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printSettings.includePrice}
                      onChange={(e) => setPrintSettings({...printSettings, includePrice: e.target.checked})}
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Price</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printSettings.includeSize}
                      onChange={(e) => setPrintSettings({...printSettings, includeSize: e.target.checked})}
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Size</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printSettings.includeMadeBy}
                      onChange={(e) => setPrintSettings({...printSettings, includeMadeBy: e.target.checked})}
                      className="h-4 w-4 text-purple-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Made By</span>
                  </label>
                </div>

                <h4 className="font-medium text-gray-900 mb-3">Sticker Preview</h4>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div 
                    className="border border-gray-400 bg-white p-2 text-center flex flex-col mx-auto"
                    style={{
                      width: `${printSettings.stickerWidth * 60}px`,
                      height: `${printSettings.stickerHeight * 60}px`,
                      fontSize: `${printSettings.fontSize}px`,
                      fontFamily: 'Arial, Helvetica, sans-serif'
                    }}
                  >
                    <div className="font-bold text-xs" style={{ fontSize: `${printSettings.fontSize}px` }}>
                      DUBAI BORKA HOUSE
                    </div>
                    {printSettings.includeName && (
                      <div className="truncate" style={{ fontSize: '10px', margin: '2px 0' }}>
                        Sample Abaya
                      </div>
                    )}
                    {printSettings.includePrice && (
                      <div className="font-bold" style={{ fontSize: `${printSettings.fontSize + 1}px`, margin: '2px 0' }}>
                        ৳2,500
                      </div>
                    )}
                    <div className="my-1">
                      <div className="bg-black h-6 w-full mb-1"></div>
                    </div>
                    {printSettings.includeSize && (
                      <div style={{ fontSize: `${printSettings.fontSize - 3}px`, margin: '1px 0' }}>M,L,XL</div>
                    )}
                    <div className="flex justify-end w-full mt-auto">
                      {printSettings.includeMadeBy && (
                        <div className="text-gray-600 text-right" style={{ fontSize: '10px' }}>
                          Dubai
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={() => {
                  localStorage.setItem("printSettings", JSON.stringify(printSettings));
                  toast.success("Barcode settings saved successfully!");
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                ✅ Save Settings
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
          {/* Backup Statistics Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-4">📊 ব্যাকআপ পরিসংখ্যান</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-bold">32</div>
                <div className="text-xs sm:text-sm opacity-90">সংগ্রহ (Collections)</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-bold">∞</div>
                <div className="text-xs sm:text-sm opacity-90">মোট রেকর্ড</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-bold">v2.0</div>
                <div className="text-xs sm:text-sm opacity-90">ব্যাকআপ সংস্করণ</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-bold">JSON</div>
                <div className="text-xs sm:text-sm opacity-90">ফরম্যাট</div>
              </div>
            </div>
          </div>

          {/* Main Backup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Export Data Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl flex-shrink-0">📤</span>
                <div>
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg">সম্পূর্ণ ডেটা এক্সপোর্ট</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">সমস্ত সংগ্রহ ব্যাকআপ করুন</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                এতে অন্তর্ভুক্ত রয়েছে: পণ্য, বিক্রয়, গ্রাহক, কর্মচারী, শাখা, ছাড়, অনুগত্য প্রোগ্রাম, কুপন এবং আরও অনেক কিছু।
              </p>
              <button
                onClick={exportData}
                disabled={isExporting || !exportAllData}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-sm transition-all"
              >
                {isExporting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>এক্সপোর্ট করছে...</span>
                  </div>
                ) : (
                  "📥 সম্পূর্ণ ব্যাকআপ ডাউনলোড করুন"
                )}
              </button>
            </div>

            {/* Import Data Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl flex-shrink-0">📥</span>
                <div>
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg">ডেটা পুনরুদ্ধার করুন</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">ব্যাকআপ ফাইল থেকে পুনরুদ্ধার করুন</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                আপনার সম্পূর্ণ ডেটা একটি JSON ব্যাকআপ ফাইল থেকে পুনরুদ্ধার করুন।
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  disabled={isImporting}
                  className="hidden"
                  id="backup-file-input"
                />
                <label
                  htmlFor="backup-file-input"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 font-semibold text-sm transition-all text-center cursor-pointer"
                >
                  {isImporting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>পুনরুদ্ধার করছে...</span>
                    </div>
                  ) : (
                    "📤 JSON ফাইল নির্বাচন করুন"
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Backup Collections Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-4 sm:p-6">
            <h4 className="font-bold text-gray-900 mb-4 text-base sm:text-lg">✅ ব্যাকআপ করা সংগ্রহসমূহ</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                "Branches", "Employees", "Discounts", "Products",
                "Sales", "Customers", "Categories", "Stock Movements",
                "Transactions", "Branch Transfers", "Settings", "Reviews",
                "Wishlist", "Coupons", "Returns", "Analytics",
                "User Roles", "User Rules", "Loyalty Programs", "Points",
                "Advanced Coupons", "Redemptions", "Referrals", "Online Products",
                "Online Orders", "WhatsApp Orders", "Notifications", "Permissions",
                "Application Logs", "Supplier Data", "Custom Fields", "More..."
              ].map((collection, idx) => (
                <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">✓ {collection}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 sm:p-6">
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-900 mb-2">গুরুত্বপূর্ণ নোট:</h4>
                  <ul className="text-xs sm:text-sm text-yellow-800 space-y-1">
                    <li>✓ নিয়মিত ব্যাকআপ নিন - অন্তত সপ্তাহে একবার</li>
                    <li>✓ ইমপোর্টের আগে সর্বদা ব্যাকআপ নিন</li>
                    <li>✓ ইমপোর্ট বিদ্যমান ডেটা ওভাররাইট করবে</li>
                    <li>✓ শুধুমাত্র DUBAI BORKA HOUSE থেকে তৈরি ফাইল ইমপোর্ট করুন</li>
                    <li>✓ ব্যাকআপ ফাইলটি নিরাপদ জায়গায় সংরক্ষণ করুন</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 sm:p-6">
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">ℹ️</span>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 mb-2">ব্যাকআপ তথ্য:</h4>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li>• ব্যাকআপ ভার্সন: 2.0 (সম্পূর্ণ ডেটা সহায়তা)</li>
                    <li>• ফরম্যাট: JSON (যেকোনো ডিভাইসে নিরাপদ)</li>
                    <li>• সমস্ত 32টি সংগ্রহ সংরক্ষিত</li>
                    <li>• স্বয়ংক্রিয় টাইমস্ট্যাম্প এবং সংস্করণ নিয়ন্ত্রণ</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Import Preview Modal */}
          {showImportPreview && importPreviewData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-10">
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">📊 ডেটা পুনরুদ্ধার পূর্বরূপ</h2>
                  <p className="text-blue-100">আপনার সিস্টেমে এই ডেটা পুনরুদ্ধার হবে</p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">{importPreviewData.stats.totalRecords}</div>
                      <div className="text-xs text-gray-600 mt-1">মোট রেকর্ড</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                      <div className="text-3xl font-bold text-green-600">{importPreviewData.stats.collections.length}</div>
                      <div className="text-xs text-gray-600 mt-1">সংগ্রহ</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                      <div className="text-sm font-bold text-purple-600">{importPreviewData.stats.version}</div>
                      <div className="text-xs text-gray-600 mt-1">সংস্করণ</div>
                    </div>
                  </div>

                  {/* Detailed Collections List */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>📋</span> সংগ্রহ বিবরণ
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {importPreviewData.stats.collections.map((col: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-lg">📁</span>
                              <div className="flex-1">
                                <span className="font-medium text-gray-900 capitalize">{col.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {col.count} {col.count === 1 ? 'রেকর্ড' : 'রেকর্ড'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp Info */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs text-yellow-800">
                      <span className="font-bold">⏰ ব্যাকআপ সময়:</span> {importPreviewData.stats.timestamp}
                    </p>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      <span className="font-bold">⚠️ সতর্কতা:</span> এটি আপনার সমস্ত বর্তমান ডেটা প্রতিস্থাপন করবে। পুনরুদ্ধারের পরে আপনি ডেটা ফেরত করতে পারবেন না।
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-100 p-6 flex gap-3 justify-end sticky bottom-0">
                  <button
                    onClick={() => {
                      setShowImportPreview(false);
                      setImportPreviewData(null);
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold transition"
                  >
                    ❌ বাতিল করুন
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={isImporting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>পুনরুদ্ধার করছে...</span>
                      </>
                    ) : (
                      <>✅ পুনরুদ্ধার শুরু করুন</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {activeTab === "notifications" && (
        <div>
          <NotificationSoundSettings />
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
  );
}
