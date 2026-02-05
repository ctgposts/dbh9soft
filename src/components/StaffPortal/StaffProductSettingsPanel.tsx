import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsConfig {
  // Image settings
  imageCompressionEnabled: boolean;
  targetImageSize: number;
  jpegQuality: number;
  maxImagesPerProduct: number;
  allowImageDeletion: boolean;
  enableAutoRotate: boolean;
  autoDeleteOldImages: number;

  // Scanner settings
  enableFlashSupport: boolean;
  continuousScan: boolean;
  soundNotifications: boolean;
  vibrationFeedback: boolean;

  // Features
  enableCollaborativeNotes: boolean;
  enableImageLiking: boolean;
  enableDailyReport: boolean;

  // Permissions (comma-separated)
  canView: string;
  canUpload: string;
  canDelete: string;
  canApprove: string;
}

interface StaffProductSettingsPanelProps {
  branchId: string;
  onClose: () => void;
  onSave?: (settings: SettingsConfig) => void;
}

export const StaffProductSettingsPanel: React.FC<StaffProductSettingsPanelProps> = ({
  branchId,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState<SettingsConfig>({
    imageCompressionEnabled: true,
    targetImageSize: 100,
    jpegQuality: 85,
    maxImagesPerProduct: 3,
    allowImageDeletion: true,
    enableAutoRotate: true,
    autoDeleteOldImages: 0,
    enableFlashSupport: true,
    continuousScan: false,
    soundNotifications: true,
    vibrationFeedback: true,
    enableCollaborativeNotes: true,
    enableImageLiking: true,
    enableDailyReport: false,
    canView: 'staff, manager, admin',
    canUpload: 'staff, manager, admin',
    canDelete: 'manager, admin',
    canApprove: 'manager, admin',
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof SettingsConfig, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(settings);
      }
      setIsDirty(false);
      toast.success('সেটিংস সফলভাবে সংরক্ষিত হয়েছে');
    } catch (error) {
      toast.error('সেটিংস সংরক্ষণ ব্যর্থ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('সকল সেটিংস ডিফল্টে রিসেট করবেন?')) {
      setSettings({
        imageCompressionEnabled: true,
        targetImageSize: 100,
        jpegQuality: 85,
        maxImagesPerProduct: 3,
        allowImageDeletion: true,
        enableAutoRotate: true,
        autoDeleteOldImages: 0,
        enableFlashSupport: true,
        continuousScan: false,
        soundNotifications: true,
        vibrationFeedback: true,
        enableCollaborativeNotes: true,
        enableImageLiking: true,
        enableDailyReport: false,
        canView: 'staff, manager, admin',
        canUpload: 'staff, manager, admin',
        canDelete: 'manager, admin',
        canApprove: 'manager, admin',
      });
      setIsDirty(false);
      toast.success('সেটিংস রিসেট হয়েছে');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto space-y-6">
      {/* হেডার */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">স্টাফ প্রোডাক্ট সেটিংস</h2>
        </div>
        {isDirty && (
          <div className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
            ⚠️ পরিবর্তন হয়েছে
          </div>
        )}
      </div>

      {/* স্ক্রলেবল কন্টেন্ট */}
      <div className="max-h-96 overflow-y-auto space-y-6">
        {/* ইমেজ সেটিংস */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🖼️ ইমেজ সেটিংস
          </h3>

          <div className="space-y-4">
            {/* কম্প্রেশন এনাবল */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.imageCompressionEnabled}
                onChange={(e) =>
                  handleChange('imageCompressionEnabled', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-semibold text-gray-700">ছবি কম্প্রেশন সক্ষম করুন</p>
                <p className="text-sm text-gray-500">
                  100 KB এ স্বয়ংক্রিয় কম্প্রেশন
                </p>
              </div>
            </label>

            {/* টার্গেট সাইজ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                টার্গেট ছবির সাইজ (KB)
              </label>
              <input
                type="number"
                value={settings.targetImageSize}
                onChange={(e) =>
                  handleChange('targetImageSize', parseInt(e.target.value))
                }
                min="50"
                max="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">সুপারিশ: 100 KB</p>
            </div>

            {/* JPEG কোয়ালিটি */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                JPEG কোয়ালিটি: {settings.jpegQuality}%
              </label>
              <input
                type="range"
                value={settings.jpegQuality}
                onChange={(e) =>
                  handleChange('jpegQuality', parseInt(e.target.value))
                }
                min="60"
                max="95"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">সুপারিশ: 85%</p>
            </div>

            {/* ম্যাক্স ইমেজ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                প্রতি পণ্যে সর্বোচ্চ ছবি
              </label>
              <select
                value={settings.maxImagesPerProduct}
                onChange={(e) =>
                  handleChange('maxImagesPerProduct', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 ছবি</option>
                <option value="2">2 ছবি</option>
                <option value="3">3 ছবি</option>
                <option value="5">5 ছবি</option>
              </select>
            </div>

            {/* অটো রোটেট */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAutoRotate}
                onChange={(e) => handleChange('enableAutoRotate', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-semibold text-gray-700">অটো রোটেশন সক্ষম করুন</p>
                <p className="text-sm text-gray-500">
                  ছবি স্বয়ংক্রিয়ভাবে সঠিক দিকে ঘোরান
                </p>
              </div>
            </label>

            {/* ডিলিশন অনুমতি */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowImageDeletion}
                onChange={(e) =>
                  handleChange('allowImageDeletion', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-semibold text-gray-700">ছবি মোছার অনুমতি</p>
                <p className="text-sm text-gray-500">
                  স্টাফ তাদের আপলোডকৃত ছবি মুছতে পারবে
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* স্ক্যানার সেটিংস */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📷 স্ক্যানার সেটিংস
          </h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableFlashSupport}
                onChange={(e) =>
                  handleChange('enableFlashSupport', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <p className="font-semibold text-gray-700">ফ্ল্যাশ সাপোর্ট</p>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.continuousScan}
                onChange={(e) =>
                  handleChange('continuousScan', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <p className="font-semibold text-gray-700">ক্রমাগত স্ক্যানিং</p>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundNotifications}
                onChange={(e) =>
                  handleChange('soundNotifications', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <p className="font-semibold text-gray-700">সাউন্ড নোটিফিকেশন</p>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vibrationFeedback}
                onChange={(e) =>
                  handleChange('vibrationFeedback', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <p className="font-semibold text-gray-700">ভাইব্রেশন ফিডব্যাক</p>
            </label>
          </div>
        </div>

        {/* ফিচার সেটিংস */}
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ✨ ফিচার সেটিংস
          </h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableCollaborativeNotes}
                onChange={(e) =>
                  handleChange('enableCollaborativeNotes', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-semibold text-gray-700">সহযোগিতামূলক নোট</p>
                <p className="text-sm text-gray-500">টিম মন্তব্য যোগ করতে পারবে</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableImageLiking}
                onChange={(e) =>
                  handleChange('enableImageLiking', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-semibold text-gray-700">ইমেজ লাইকিং</p>
                <p className="text-sm text-gray-500">ছবিতে লাইক যোগ করতে পারবে</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableDailyReport}
                onChange={(e) =>
                  handleChange('enableDailyReport', e.target.checked)
                }
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-semibold text-gray-700">দৈনিক রিপোর্ট</p>
                <p className="text-sm text-gray-500">স্বয়ংক্রিয় দৈনিক সারাংশ পাঠান</p>
              </div>
            </label>
          </div>
        </div>

        {/* পার্মিশন সেটিংস */}
        <div className="border-l-4 border-red-500 pl-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔐 পার্মিশন সেটিংস
          </h3>

          <div className="space-y-4 text-sm">
            <p className="text-gray-600 mb-3">
              ভূমিকা নির্দিষ্ট করুন (কমা দ্বারা পৃথক করুন):
            </p>

            {[
              { key: 'canView' as const, label: 'দেখতে পারে' },
              { key: 'canUpload' as const, label: 'আপলোড করতে পারে' },
              { key: 'canDelete' as const, label: 'মুছতে পারে' },
              { key: 'canApprove' as const, label: 'অনুমোদন করতে পারে' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block font-semibold text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={settings[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="staff, manager, admin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ফুটার অ্যাকশন */}
      <div className="flex gap-2 border-t border-gray-200 pt-4">
        <button
          onClick={handleReset}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          রিসেট করুন
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition"
        >
          বাতিল করুন
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              সংরক্ষণ করছি...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              সংরক্ষণ করুন
            </>
          )}
        </button>
      </div>
    </div>
  );
};
