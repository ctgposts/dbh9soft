import React, { useState, useEffect } from 'react';
import {
  Settings, Save, RotateCcw, AlertCircle, CheckCircle, Copy, Eye, EyeOff,
  BarChart3, Users, Lock, Unlock, Package, Image as ImageIcon, Sliders,
  ChevronDown, ChevronUp, RefreshCw, Download, Upload, Trash2, Plus,
  Camera, Edit2, Check, X
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * স্টাফ প্রোডাক্ট ডিটেইল মডিউল
 * সকল ফিচার, সেটিংস এবং কাস্টম কনফিগারেশন পরিচালনার জন্য
 */

interface ProductDetailConfig {
  // বেসিক তথ্য
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  price: number;

  // ইমেজ সেটিংস
  images: {
    enabled: boolean;
    maxCount: number;
    compression: boolean;
    quality: number;
    autoRotate: boolean;
  };

  // স্ক্যানার সেটিংস
  scanner: {
    enabled: boolean;
    continuousScan: boolean;
    flashSupport: boolean;
    soundAlert: boolean;
    vibration: boolean;
  };

  // ফিচার ফ্ল্যাগস
  features: {
    fabricAnalysis: boolean;
    colorRecognition: boolean;
    designDetection: boolean;
    embroideryDetection: boolean;
    collaborativeNotes: boolean;
    imageRating: boolean;
    dailyReport: boolean;
  };

  // পারমিশন সেটিংস
  permissions: {
    canView: string[];
    canUpload: string[];
    canEdit: string[];
    canDelete: string[];
    canApprove: string[];
  };

  // কাস্টম সেটিংস
  custom: {
    [key: string]: any;
  };
}

interface StaffProductDetailModuleProps {
  productId?: string;
  branchId?: string;
  onClose?: () => void;
  onSave?: (config: ProductDetailConfig) => void;
}

export const StaffProductDetailModule: React.FC<StaffProductDetailModuleProps> = ({
  productId = 'NEW',
  branchId = 'default',
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<ProductDetailConfig>({
    productId: productId,
    productName: '',
    barcode: '',
    category: 'ফ্যাব্রিক্স',
    price: 0,

    images: {
      enabled: true,
      maxCount: 5,
      compression: true,
      quality: 85,
      autoRotate: true,
    },

    scanner: {
      enabled: true,
      continuousScan: false,
      flashSupport: true,
      soundAlert: true,
      vibration: true,
    },

    features: {
      fabricAnalysis: true,
      colorRecognition: true,
      designDetection: true,
      embroideryDetection: true,
      collaborativeNotes: true,
      imageRating: true,
      dailyReport: false,
    },

    permissions: {
      canView: ['staff', 'manager', 'admin'],
      canUpload: ['staff', 'manager', 'admin'],
      canEdit: ['manager', 'admin'],
      canDelete: ['admin'],
      canApprove: ['manager', 'admin'],
    },

    custom: {},
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    images: true,
    scanner: true,
    features: true,
    permissions: false,
    custom: false,
    preview: false,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'logs'>('settings');

  // সেকশন টগল করুন
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // কনফিগ পরিবর্তন করুন
  const updateConfig = (updates: Partial<ProductDetailConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // নেস্টেড কনফিগ আপডেট করুন
  const updateNestedConfig = (section: string, key: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const sectionData = newConfig[section as keyof ProductDetailConfig] as Record<string, any>;
      if (sectionData && typeof sectionData === 'object') {
        sectionData[key] = value;
      }
      return newConfig;
    });
    setIsDirty(true);
  };

  // অ্যারে পারমিশন আপডেট করুন
  const updatePermission = (permission: keyof ProductDetailConfig['permissions'], roles: string) => {
    setConfig(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: roles.split(',').map(r => r.trim()),
      },
    }));
    setIsDirty(true);
  };

  // সংরক্ষণ করুন
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(config);
      }
      setIsDirty(false);
      toast.success('সেটিংস সংরক্ষিত হয়েছে ✅');
    } catch (error) {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে ❌');
    } finally {
      setIsSaving(false);
    }
  };

  // রিসেট করুন
  const handleReset = () => {
    if (confirm('সব পরিবর্তন বাতিল করতে চান?')) {
      setConfig(config); // Reload from server or initial state
      setIsDirty(false);
      toast.info('রিসেট করা হয়েছে');
    }
  };

  // কপি করুন
  const handleCopy = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json);
    toast.success('কনফিগ কপি করা হয়েছে');
  };

  // এক্সপোর্ট করুন
  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-config-${config.productId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ডাউনলোড করা হয়েছে');
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* হেডার */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                স্টাফ পণ্য বিস্তারিত মডিউল
              </h1>
              <p className="text-sm text-gray-600">
                পণ্য: {config.productName || 'নতুন পণ্য'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* ট্যাব নেভিগেশন */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['settings', 'preview', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'settings' && '⚙️ সেটিংস'}
              {tab === 'preview' && '👁️ প্রিভিউ'}
              {tab === 'logs' && '📋 লগস'}
            </button>
          ))}
        </div>

        {/* কন্টেন্ট এরিয়া */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* বেসিক ইনফরমেশন সেকশন */}
            <div className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggleSection('basic')}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-800">বেসিক ইনফরমেশন</h2>
                </div>
                {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.basic && (
                <div className="border-t p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* প্রোডাক্ট নাম */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        পণ্যের নাম
                      </label>
                      <input
                        type="text"
                        value={config.productName}
                        onChange={(e) => updateConfig({ productName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="যেমন: আবায়া, শাড়ী, ইত্যাদি"
                      />
                    </div>

                    {/* বারকোড */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        বারকোড
                      </label>
                      <input
                        type="text"
                        value={config.barcode}
                        onChange={(e) => updateConfig({ barcode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="DBH-0001234"
                      />
                    </div>

                    {/* ক্যাটাগরি */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ক্যাটাগরি
                      </label>
                      <select
                        value={config.category}
                        onChange={(e) => updateConfig({ category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>ফ্যাব্রিক্স</option>
                        <option>পোশাক</option>
                        <option>আনুষাঙ্গিক</option>
                        <option>অন্যান্য</option>
                      </select>
                    </div>

                    {/* মূল্য */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        মূল্য (টাকা)
                      </label>
                      <input
                        type="number"
                        value={config.price}
                        onChange={(e) => updateConfig({ price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ইমেজ সেটিংস সেকশন */}
            <div className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggleSection('images')}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-800">ইমেজ সেটিংস</h2>
                </div>
                {expandedSections.images ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.images && (
                <div className="border-t p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* সর্বোচ্চ ছবি সংখ্যা */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        সর্বোচ্চ ছবি ({config.images.maxCount})
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={config.images.maxCount}
                        onChange={(e) =>
                          updateNestedConfig('images', 'maxCount', parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>

                    {/* গুণমান */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ছবির গুণমান ({config.images.quality}%)
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={config.images.quality}
                        onChange={(e) =>
                          updateNestedConfig('images', 'quality', parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* টগল অপশন */}
                  <div className="space-y-2">
                    {[
                      { key: 'enabled', label: '📸 ইমেজ আপলোড সক্ষম করুন' },
                      { key: 'compression', label: '🗜️ সংকোচন সক্ষম করুন' },
                      { key: 'autoRotate', label: '🔄 স্বয়ংক্রিয় রোটেশন' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.images[key as keyof typeof config.images] as boolean}
                          onChange={(e) =>
                            updateNestedConfig('images', key, e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* স্ক্যানার সেটিংস সেকশন */}
            <div className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggleSection('scanner')}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-800">স্ক্যানার সেটিংস</h2>
                </div>
                {expandedSections.scanner ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.scanner && (
                <div className="border-t p-4 space-y-2">
                  {[
                    { key: 'enabled', label: '✅ স্ক্যানার সক্ষম করুন' },
                    { key: 'continuousScan', label: '🔁 ক্রমাগত স্ক্যান করুন' },
                    { key: 'flashSupport', label: '⚡ ফ্ল্যাশ সাপোর্ট' },
                    { key: 'soundAlert', label: '🔔 সাউন্ড অ্যালার্ট' },
                    { key: 'vibration', label: '📳 ভাইব্রেশন ফিডব্যাক' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.scanner[key as keyof typeof config.scanner] as boolean}
                        onChange={(e) =>
                          updateNestedConfig('scanner', key, e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ফিচার ফ্ল্যাগস সেকশন */}
            <div className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggleSection('features')}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-semibold text-gray-800">উন্নত ফিচার</h2>
                </div>
                {expandedSections.features ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.features && (
                <div className="border-t p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'fabricAnalysis', label: '🧵 ফ্যাব্রিক বিশ্লেষণ', icon: '🧵' },
                      { key: 'colorRecognition', label: '🎨 রঙ স্বীকৃতি', icon: '🎨' },
                      { key: 'designDetection', label: '✨ ডিজাইন শনাক্তকরণ', icon: '✨' },
                      {
                        key: 'embroideryDetection',
                        label: '💎 এমব্রয়ডারি সনাক্তকরণ',
                        icon: '💎',
                      },
                      {
                        key: 'collaborativeNotes',
                        label: '📝 সহযোগী নোটস',
                        icon: '📝',
                      },
                      { key: 'imageRating', label: '⭐ ইমেজ রেটিং', icon: '⭐' },
                      { key: 'dailyReport', label: '📊 দৈনিক রিপোর্ট', icon: '📊' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.features[key as keyof typeof config.features] as boolean}
                          onChange={(e) =>
                            updateNestedConfig('features', key, e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* পারমিশন সেটিংস সেকশন */}
            <div className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggleSection('permissions')}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-gray-800">পারমিশন ম্যানেজমেন্ট</h2>
                </div>
                {expandedSections.permissions ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.permissions && (
                <div className="border-t p-4 space-y-4">
                  {[
                    {
                      key: 'canView',
                      label: '👁️ দেখতে পারবে',
                      icon: '👁️',
                    },
                    {
                      key: 'canUpload',
                      label: '📤 আপলোড করতে পারবে',
                      icon: '📤',
                    },
                    {
                      key: 'canEdit',
                      label: '✏️ সম্পাদনা করতে পারবে',
                      icon: '✏️',
                    },
                    {
                      key: 'canDelete',
                      label: '🗑️ মুছতে পারবে',
                      icon: '🗑️',
                    },
                    {
                      key: 'canApprove',
                      label: '✅ অনুমোদন করতে পারবে',
                      icon: '✅',
                    },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={config.permissions[key as keyof typeof config.permissions].join(
                          ', '
                        )}
                        onChange={(e) =>
                          updatePermission(
                            key as keyof typeof config.permissions,
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="staff, manager, admin"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        কমা দিয়ে আলাদা করুন
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* কাস্টম সেটিংস সেকশন */}
            <div className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggleSection('custom')}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-800">কাস্টম সেটিংস</h2>
                </div>
                {expandedSections.custom ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.custom && (
                <div className="border-t p-4">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                      {JSON.stringify(config.custom, null, 2)}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-600">
                    💡 JSON ফরম্যাটে কাস্টম ডেটা যোগ করুন
                  </p>
                </div>
              )}
            </div>

            {/* অ্যাকশন বাটন */}
            <div className="flex flex-wrap gap-2 sticky bottom-0 bg-white p-4 rounded-lg shadow">
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>

              <button
                onClick={handleReset}
                disabled={!isDirty}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                রিসেট করুন
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Copy className="w-4 h-4" />
                কপি করুন
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Download className="w-4 h-4" />
                ডাউনলোড করুন
              </button>
            </div>
          </div>
        )}

        {/* প্রিভিউ ট্যাব */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">কনফিগারেশন প্রিভিউ</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-auto max-h-96">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* লগস ট্যাব */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">কার্যকলাপ লগস</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📝 শেষ সংরক্ষণ: কখনো হয়নি</p>
              <p>👤 সম্পাদনাকারী: স্টাফ ইউজার</p>
              <p>⏰ সৃষ্টির সময়: আজ</p>
              <p>🔄 সংস্করণ: 1.0</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffProductDetailModule;
