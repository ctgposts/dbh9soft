import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Settings, Eye, ToggleRight, ToggleLeft, ChevronRight, ChevronDown,
  Package, Image as ImageIcon, Camera, Zap, Lock, Database,
  Save, Copy, Download, RefreshCw, AlertCircle, Loader
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * স্টাফ পণ্য সেটিংস এবং ফিচার ড্যাশবোর্ড
 * সমস্ত সেটিংস এক জায়গায় দেখা এবং পরিচালনা করা
 * রিয়েল-টাইম ডেটাবেস ইন্টিগ্রেশন সহ
 */

interface FeatureSetting {
  id: string;
  name: string;
  description: string;
  category: 'image' | 'scanner' | 'analysis' | 'social' | 'reporting' | 'advanced';
  enabled: boolean;
  icon: React.ReactNode;
  subFeatures?: FeatureSetting[];
}

interface DashboardState {
  features: FeatureSetting[];
  expandedCategory: string | null;
  loading: boolean;
  branchId: string;
}

export const StaffProductFeatureDashboard: React.FC<{ branchId?: string }> = ({ branchId = "current-branch" }) => {
  // Real-time database queries
  const staffSettings = useQuery(api.staffProductSettings?.getStaffProductSettings, 
    branchId ? { branchId: branchId as any } : "skip"
  );

  const updateSettingsMutation = useMutation(api.staffProductSettings?.updateStaffProductSettings);

  const [state, setState] = useState<DashboardState>({
    features: [
      // ইমেজ ফিচার
      {
        id: 'image-upload',
        name: 'ছবি আপলোড',
        description: 'পণ্যের ছবি আপলোড করুন এবং সংরক্ষণ করুন',
        category: 'image',
        enabled: true,
        icon: <ImageIcon className="w-5 h-5" />,
        subFeatures: [
          {
            id: 'image-compression',
            name: 'স্বয়ংক্রিয় সংকোচন',
            description: 'ছবি সংকুচিত করে ডিভাইসের স্টোরেজ সাশ্রয় করুন',
            category: 'image',
            enabled: true,
            icon: <Zap className="w-4 h-4" />,
          },
          {
            id: 'image-rotation',
            name: 'স্বয়ংক্রিয় ঘূর্ণন',
            description: 'ছবি স্বয়ংক্রিয়ভাবে সঠিক দিকে ঘোরান',
            category: 'image',
            enabled: true,
            icon: <RefreshCw className="w-4 h-4" />,
          },
          {
            id: 'image-gallery',
            name: 'গ্যালারি ভিউ',
            description: 'সমস্ত ছবি গ্যালারি হিসাবে প্রদর্শন করুন',
            category: 'image',
            enabled: true,
            icon: <Eye className="w-4 h-4" />,
          },
        ],
      },

      // স্ক্যানার ফিচার
      {
        id: 'barcode-scanner',
        name: 'বারকোড স্ক্যানার',
        description: 'দ্রুত এবং নির্ভুলভাবে বারকোড স্ক্যান করুন',
        category: 'scanner',
        enabled: true,
        icon: <Camera className="w-5 h-5" />,
        subFeatures: [
          {
            id: 'continuous-scan',
            name: 'ক্রমাগত স্ক্যানিং',
            description: 'একটানা একাধিক বারকোড স্ক্যান করুন',
            category: 'scanner',
            enabled: false,
            icon: <ToggleRight className="w-4 h-4" />,
          },
          {
            id: 'flash-support',
            name: 'ফ্ল্যাশ সাপোর্ট',
            description: 'কম আলোতে স্ক্যানিং এর জন্য ফ্ল্যাশ ব্যবহার করুন',
            category: 'scanner',
            enabled: true,
            icon: <Zap className="w-4 h-4" />,
          },
          {
            id: 'sound-alert',
            name: 'সাউন্ড অ্যালার্ট',
            description: 'সফল স্ক্যানের সময় সাউন্ড বাজান',
            category: 'scanner',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'vibration',
            name: 'ভাইব্রেশন ফিডব্যাক',
            description: 'সফল স্ক্যানে ফোন কম্পন করান',
            category: 'scanner',
            enabled: true,
            icon: <ToggleRight className="w-4 h-4" />,
          },
        ],
      },

      // বিশ্লেষণ ফিচার
      {
        id: 'ai-analysis',
        name: 'AI বিশ্লেষণ সিস্টেম',
        description: 'কৃত্রিম বুদ্ধিমত্তা ব্যবহার করে পণ্য বিশ্লেষণ করুন',
        category: 'analysis',
        enabled: true,
        icon: <Zap className="w-5 h-5" />,
        subFeatures: [
          {
            id: 'fabric-analysis',
            name: 'ফ্যাব্রিক বিশ্লেষণ',
            description: 'ফ্যাব্রিক্সের ধরন এবং মান সনাক্ত করুন',
            category: 'analysis',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'color-recognition',
            name: 'রঙ স্বীকৃতি',
            description: 'পোশাকের রঙ স্বয়ংক্রিয়ভাবে সনাক্ত করুন',
            category: 'analysis',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'design-detection',
            name: 'ডিজাইন শনাক্তকরণ',
            description: 'পোশাকের ডিজাইন উপাদান সনাক্ত করুন',
            category: 'analysis',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'embroidery-detection',
            name: 'এমব্রয়ডারি সনাক্তকরণ',
            description: 'এমব্রয়ডারি এবং সজ্জা সনাক্ত করুন',
            category: 'analysis',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
        ],
      },

      // সামাজিক ফিচার
      {
        id: 'social-features',
        name: 'সামাজিক ফিচার',
        description: 'স্টাফদের মধ্যে সহযোগিতা এবং প্রতিযোগিতা',
        category: 'social',
        enabled: true,
        icon: <Package className="w-5 h-5" />,
        subFeatures: [
          {
            id: 'collaborative-notes',
            name: 'সহযোগী নোটস',
            description: 'অন্যান্য স্টাফের সাথে নোটস শেয়ার করুন',
            category: 'social',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'image-rating',
            name: 'ছবি রেটিং',
            description: 'ছবির গুণমান রেট করুন এবং মন্তব্য করুন',
            category: 'social',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'leaderboard',
            name: 'লিডারবোর্ড',
            description: 'স্টাফদের মধ্যে প্রতিযোগিতা এবং র‍্যাঙ্কিং',
            category: 'social',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
        ],
      },

      // রিপোর্টিং ফিচার
      {
        id: 'reporting',
        name: 'রিপোর্টিং এবং বিশ্লেষণ',
        description: 'কর্মক্ষমতা এবং পরিসংখ্যান রিপোর্ট তৈরি করুন',
        category: 'reporting',
        enabled: true,
        icon: <Package className="w-5 h-5" />,
        subFeatures: [
          {
            id: 'daily-report',
            name: 'দৈনিক রিপোর্ট',
            description: 'প্রতিদিনের কার্যকলাপ রিপোর্ট তৈরি করুন',
            category: 'reporting',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
          {
            id: 'statistics',
            name: 'পরিসংখ্যান ড্যাশবোর্ড',
            description: 'মোট স্ক্যান, আপলোড এবং বৃদ্ধি দেখুন',
            category: 'reporting',
            enabled: true,
            icon: <Package className="w-4 h-4" />,
          },
        ],
      },
    ],
    expandedCategory: null,
    loading: false,
    branchId,
  });

  // ডাটাবেসের সেটিংস লোড হওয়ার সময় স্টেট আপডেট করুন
  useEffect(() => {
    if (staffSettings) {
      // সেটিংস থেকে ফিচার সক্ষমতা আপডেট করুন
      setState(prev => ({
        ...prev,
        features: prev.features.map(feature => {
          // সেটিংস অনুযায়ী এনাবল/ডিসেবল করুন
          const enabledKey = feature.id.replace(/-/g, '');
          const isEnabled = (staffSettings as any)[enabledKey] ?? feature.enabled;
          
          return {
            ...feature,
            enabled: isEnabled,
            subFeatures: feature.subFeatures?.map(sub => ({
              ...sub,
              enabled: (staffSettings as any)[sub.id.replace(/-/g, '')] ?? sub.enabled,
            })),
          };
        }),
      }));
    }
  }, [staffSettings]);

  const toggleFeature = (featureId: string) => {
    setState(prev => ({
      ...prev,
      features: prev.features.map(feature => {
        if (feature.id === featureId) {
          return { ...feature, enabled: !feature.enabled };
        }
        if (feature.subFeatures) {
          return {
            ...feature,
            subFeatures: feature.subFeatures.map(sub =>
              sub.id === featureId ? { ...sub, enabled: !sub.enabled } : sub
            ),
          };
        }
        return feature;
      }),
    }));
  };

  const toggleCategory = (category: string) => {
    setState(prev => ({
      ...prev,
      expandedCategory: prev.expandedCategory === category ? null : category,
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'image':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'scanner':
        return 'from-purple-50 to-purple-100 border-purple-200';
      case 'analysis':
        return 'from-green-50 to-green-100 border-green-200';
      case 'social':
        return 'from-pink-50 to-pink-100 border-pink-200';
      case 'reporting':
        return 'from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'image':
        return 'bg-blue-100 text-blue-800';
      case 'scanner':
        return 'bg-purple-100 text-purple-800';
      case 'analysis':
        return 'bg-green-100 text-green-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      case 'reporting':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveAll = () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // ডাটাবেসে সব সেটিংস সংরক্ষণ করুন
      const settingsToUpdate: any = {};
      
      state.features.forEach(feature => {
        settingsToUpdate[feature.id.replace(/-/g, '')] = feature.enabled;
        
        feature.subFeatures?.forEach(sub => {
          settingsToUpdate[sub.id.replace(/-/g, '')] = sub.enabled;
        });
      });

      // Convex mutation কল করুন
      updateSettingsMutation({
        branchId: branchId as any,
        ...settingsToUpdate,
      });

      toast.success('সেটিংস সফলভাবে সংরক্ষিত হয়েছে ✅');
    } catch (error) {
      console.error('সেটিংস সংরক্ষণ ত্রুটি:', error);
      toast.error('সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(state.features, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff-features-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('কনফিগ ডাউনলোড করা হয়েছে ✅');
  };

  const enabledCount = state.features.reduce(
    (acc, feature) =>
      acc + (feature.enabled ? 1 : 0) + (feature.subFeatures?.filter(s => s.enabled).length || 0),
    0
  );

  const totalCount = state.features.reduce(
    (acc, feature) => acc + 1 + (feature.subFeatures?.length || 0),
    0
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* হেডার */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              স্টাফ পণ্য ফিচার এবং সেটিংস
            </h1>
          </div>
          <p className="text-gray-600">সকল ফিচার পরিচালনা এবং কাস্টমাইজ করুন</p>
        </div>

        {/* স্ট্যাটিস্টিক্স কার্ড */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
            <p className="text-gray-600 text-sm font-medium mb-1">সক্রিয় ফিচার</p>
            <p className="text-3xl font-bold text-indigo-600">{enabledCount}</p>
            <p className="text-xs text-gray-500 mt-2">মোট {totalCount} এর মধ্যে</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm font-medium mb-1">সেকশন</p>
            <p className="text-3xl font-bold text-green-600">{state.features.length}</p>
            <p className="text-xs text-gray-500 mt-2">সকল ক্যাটাগরি</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <p className="text-gray-600 text-sm font-medium mb-1">সক্ষমতা অনুপাত</p>
            <p className="text-3xl font-bold text-orange-600">
              {((enabledCount / totalCount) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">ফিচার সক্ষম</p>
          </div>
        </div>

        {/* ফিচার কার্ড */}
        <div className="space-y-4 mb-8">
          {state.features.map(feature => (
            <div
              key={feature.id}
              className={`bg-gradient-to-r ${getCategoryColor(feature.category)} rounded-lg border shadow-sm`}
            >
              {/* মেইন ফিচার হেডার */}
              <div
                onClick={() => toggleCategory(feature.id)}
                className="p-4 cursor-pointer hover:bg-white/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                        feature.category
                      )}`}
                    >
                      {feature.category === 'image'
                        ? '🖼️ ছবি'
                        : feature.category === 'scanner'
                          ? '📱 স্ক্যানার'
                          : feature.category === 'analysis'
                            ? '🧠 বিশ্লেষণ'
                            : feature.category === 'social'
                              ? '👥 সামাজিক'
                              : '📊 রিপোর্ট'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeature(feature.id);
                      }}
                      className={`p-2 rounded-lg transition ${
                        feature.enabled
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-400 text-white'
                      }`}
                    >
                      {feature.enabled ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>

                    {state.expandedCategory === feature.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* সাব-ফিচার */}
              {state.expandedCategory === feature.id && feature.subFeatures && (
                <div className="border-t border-white/50 px-4 py-4 space-y-2">
                  {feature.subFeatures.map(subFeature => (
                    <div
                      key={subFeature.id}
                      className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:bg-white/80 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-lg">{subFeature.icon}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {subFeature.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {subFeature.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFeature(subFeature.id)}
                        className={`p-2 rounded-lg transition ${
                          subFeature.enabled
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-400 text-white'
                        }`}
                      >
                        {subFeature.enabled ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* অ্যাকশন বাটন */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveAll}
            disabled={state.loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            সব সেটিংস সংরক্ষণ করুন
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-lg"
          >
            <Download className="w-5 h-5" />
            কনফিগ ডাউনলোড করুন
          </button>

          <button
            onClick={() => toast.info('সব ফিচার পুনরায় লোড করা হচ্ছে...')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            পুনরায় লোড করুন
          </button>
        </div>

        {/* তথ্য সেকশন */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">💡 টিপস এবং পরামর্শ:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>ফিচার টগল করুন স্টাফদের জন্য সক্ষম/অক্ষম করতে</li>
                <li>সাব-ফিচারগুলি দেখতে প্রতিটি বিভাগ প্রসারিত করুন</li>
                <li>কনফিগ ডাউনলোড করুন ব্যাকআপের জন্য</li>
                <li>অনুমতি সেটিংস শাখা প্রশাসক দ্বারা নিয়ন্ত্রিত</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProductFeatureDashboard;
