import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { audioNotificationService, SOUND_DEFINITIONS, NotificationSoundType } from '../utils/audioNotifications';

interface NotificationCategory {
  id: string;
  name: string;
  icon: string;
  sounds: NotificationSoundType[];
}

export function NotificationSoundSettings() {
  const [activeCategory, setActiveCategory] = useState<string>('success');
  const [soundSettings, setSoundSettings] = useState<any>(null);
  const [testingSound, setTestingSound] = useState<string | null>(null);
  const [uploadingSound, setUploadingSound] = useState<string | null>(null);
  const [customSoundNames, setCustomSoundNames] = useState<Record<string, string>>({});

  const storeSettings = useQuery(api.settings.get);
  const updateNotificationSounds = useMutation(api.settings.updateNotificationSounds);
  const uploadCustomSound = useMutation(api.settings.uploadCustomSound);

  // Sound categories
  const categories: NotificationCategory[] = [
    {
      id: 'success',
      name: '✅ সফল ইভেন্ট',
      icon: '✅',
      sounds: ['sale_success', 'sale_complete', 'refund_approved', 'payment_received', 'order_confirmed', 'task_completed'] as NotificationSoundType[],
    },
    {
      id: 'warning',
      name: '⚠️ সতর্কতা',
      icon: '⚠️',
      sounds: ['low_stock_warning', 'high_discount_alert', 'expiry_approaching', 'customer_limit_warning', 'price_mismatch', 'inventory_alert'] as NotificationSoundType[],
    },
    {
      id: 'error',
      name: '❌ ত্রুটি',
      icon: '❌',
      sounds: ['payment_failed', 'system_error', 'critical_error', 'critical_inventory', 'transaction_error', 'customer_credit_exceeded', 'invalid_transaction', 'refund_rejected'] as NotificationSoundType[],
    },
    {
      id: 'business',
      name: '💼 ব্যবসায়িক',
      icon: '💼',
      sounds: ['new_customer', 'large_order', 'bulk_order', 'bulk_sale', 'vip_customer_purchase', 'return_received', 'supplier_delivery'] as NotificationSoundType[],
    },
    {
      id: 'analytics',
      name: '📊 বিশ্লেষণ',
      icon: '📊',
      sounds: ['daily_target_reached', 'monthly_milestone', 'performance_boost', 'unusual_activity', 'system_check', 'backup_complete'] as NotificationSoundType[],
    },
    {
      id: 'other',
      name: '🎯 অন্যান্য',
      icon: '🎯',
      sounds: ['countdown_timer', 'shift_change', 'employee_checkin', 'customer_alert', 'loyalty_earned'] as NotificationSoundType[],
    },
  ];

  // Initialize from settings
  useEffect(() => {
    if (storeSettings) {
      const settings = storeSettings.notificationSounds || {
        enabled: true,
        masterVolume: 0.8,
        customSounds: {},
      };
      setSoundSettings(settings);
      audioNotificationService.setVolume(settings.masterVolume || 0.8);
    }
  }, [storeSettings]);

  const handleEnableToggle = async () => {
    const newState = !soundSettings.enabled;
    setSoundSettings({ ...soundSettings, enabled: newState });
    audioNotificationService.toggleSound(newState);
    
    try {
      await updateNotificationSounds({
        enabled: newState,
      });
      toast.success(newState ? '🔊 নোটিফিকেশন সাউন্ড সক্রিয়' : '🔇 নোটিফিকেশন সাউন্ড নিষ্ক্রিয়');
    } catch (error) {
      toast.error('সেটিংস আপডেট ব্যর্থ');
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setSoundSettings({ ...soundSettings, masterVolume: newVolume });
    audioNotificationService.setVolume(newVolume);
    
    try {
      await updateNotificationSounds({
        masterVolume: newVolume,
      });
      toast.success(`📢 ভলিউম ${Math.round(newVolume * 100)}% সেট করা হয়েছে`);
    } catch (error) {
      toast.error('ভলিউম আপডেট ব্যর্থ');
    }
  };

  const handlePlaySound = (soundType: NotificationSoundType) => {
    setTestingSound(soundType);
    audioNotificationService.play(soundType).catch((error) => {
      console.error('Failed to play sound:', error);
      toast.error('সাউন্ড প্লে করতে ব্যর্থ');
    });
    // Reset after sound completes (max 2-3 seconds for preview)
    setTimeout(() => setTestingSound(null), 2500);
  };

  const handleUploadSound = async (soundType: NotificationSoundType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ফাইল আকার ২ MB এর কম হতে হবে');
      return;
    }

    setUploadingSound(soundType);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const audioData = e.target?.result as string;
        
        try {
          // Upload to backend
          const soundId = await uploadCustomSound({
            soundType,
            soundName: file.name,
            soundData: audioData,
            fileType: file.type,
            duration: 1, // You can enhance this by reading actual duration
          });

          // Register custom sound in service
          audioNotificationService.setCustomSound(soundType, audioData);

          // Update local names
          setCustomSoundNames({
            ...customSoundNames,
            [soundType]: file.name,
          });

          toast.success(`✅ সাউন্ড আপলোড হয়েছে: ${file.name}`);
        } catch (error) {
          toast.error('সাউন্ড আপলোড ব্যর্থ');
        } finally {
          setUploadingSound(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('ফাইল পড়ার সময় ত্রুটি');
      setUploadingSound(null);
    }
  };

  const handleResetSound = (soundType: NotificationSoundType) => {
    audioNotificationService.removeCustomSound(soundType);
    const newNames = { ...customSoundNames };
    delete newNames[soundType];
    setCustomSoundNames(newNames);
    toast.success(`✅ সাউন্ড রিসেট করা হয়েছে`);
  };

  const activeCategory_data = categories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎵</span>
          <h2 className="text-2xl font-bold text-gray-900">নোটিফিকেশন সাউন্ড সেটিংস</h2>
        </div>
        <p className="text-gray-600">আপনার ব্যবসায়িক ইভেন্টগুলির জন্য কাস্টম সাউন্ড সেট করুন</p>
      </div>

      {soundSettings && (
        <>
          {/* Master Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">সমস্ত সাউন্ড</h3>
                <p className="text-sm text-gray-600">নোটিফিকেশন সাউন্ড সক্রিয়/নিষ্ক্রিয় করুন</p>
              </div>
              <button
                onClick={handleEnableToggle}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  soundSettings.enabled
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    soundSettings.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Master Volume Control */}
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">মাস্টার ভলিউম</h3>
                  <span className="text-2xl font-bold text-indigo-600">
                    {Math.round(soundSettings.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={soundSettings.masterVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🔇 নীরব</span>
                  <span>🔊 জোরে</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeCategory === cat.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sound List */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {activeCategory_data && (
              <div className="divide-y divide-gray-200">
                {activeCategory_data.sounds.map((soundType) => {
                  const sound = SOUND_DEFINITIONS[soundType];
                  const customName = customSoundNames[soundType];
                  const hasCustom = !!customName;

                  // Skip if sound definition is missing
                  if (!sound) {
                    console.warn(`Sound definition missing for: ${soundType}`);
                    return null;
                  }

                  return (
                    <div
                      key={soundType}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Sound Info */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {sound.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {sound.description}
                          </p>
                          {hasCustom && (
                            <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                              ✅ {customName}
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                          {/* Test Button */}
                          <button
                            onClick={() => handlePlaySound(soundType)}
                            disabled={testingSound === soundType || !soundSettings.enabled}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              testingSound === soundType
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50'
                            }`}
                          >
                            🔊 পরীক্ষা
                          </button>

                          {/* Upload Button */}
                          <label className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                            uploadingSound === soundType
                              ? 'bg-gray-300 text-gray-700'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }`}>
                            📁 আপলোড
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleUploadSound(soundType, e)}
                              disabled={uploadingSound === soundType}
                              className="hidden"
                            />
                          </label>

                          {/* Reset Button */}
                          {hasCustom && (
                            <button
                              onClick={() => handleResetSound(soundType)}
                              className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              ↺ রিসেট
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 টিপস</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ ডিফল্ট সাউন্ডগুলি সিস্টেম জেনারেটেড বিপ</li>
              <li>✓ কাস্টম সাউন্ড আপলোড করতে MP3, WAV বা OGG ফাইল ব্যবহার করুন</li>
              <li>✓ সর্বোচ্চ ফাইল আকার 2 MB</li>
              <li>✓ আপলোড করার আগে সবসময় সাউন্ড পরীক্ষা করুন</li>
              <li>✓ রিসেট বাটন ক্লিক করে ডিফল্টে ফিরে যান</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
