import { useState, useCallback, useEffect } from 'react';
import { audioNotificationService, NotificationSoundType } from '../utils/audioNotifications';

export interface Notification {
  id: string;
  type: NotificationSoundType;
  title: string;
  message: string;
  timestamp: number;
  category: 'success' | 'warning' | 'error' | 'business' | 'analytics' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number; // ms, 0 = persistent
}

export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Add notification with sound
  const notify = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    // Play sound asynchronously
    // ⚠️ SAFETY: Never pass repeat=true to prevent infinite beeping issues
    // Critical notifications will still play but without repetition
    if (soundEnabled) {
      audioNotificationService.play(notification.type, false).catch((error) => {
        console.error('Failed to play notification sound:', error);
      });
    }

    // Add notification
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after duration (if specified)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, [soundEnabled]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Toggle sound
  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    audioNotificationService.toggleSound(enabled);
  }, []);

  return {
    notifications,
    notify,
    removeNotification,
    clearAll,
    soundEnabled,
    toggleSound,
  };
}

// Notification presets for common business events
export const NotificationPresets = {
  // Success events
  saleSuccess: (amount: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'sale_success',
    title: '✅ বিক্রয় সফল',
    message: `${amount.toLocaleString('bn-BD')} টাকার বিক্রয় সম্পন্ন হয়েছে`,
    category: 'success',
    severity: 'low',
    duration: 4000,
  }),

  paymentReceived: (amount: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'payment_received',
    title: '💳 অর্থ প্রাপ্ত',
    message: `${amount.toLocaleString('bn-BD')} টাকা প্রাপ্ত হয়েছে`,
    category: 'success',
    severity: 'low',
    duration: 4000,
  }),

  orderConfirmed: (orderId: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'order_confirmed',
    title: '📦 অর্ডার নিশ্চিত',
    message: `অর্ডার #${orderId} নিশ্চিত করা হয়েছে`,
    category: 'business',
    severity: 'low',
    duration: 4000,
  }),

  // Warning events
  lowStock: (productName: string, quantity: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'low_stock_warning',
    title: '⚠️ স্টক কম সতর্কতা',
    message: `${productName} এর স্টক মাত্র ${quantity} এ নেমে এসেছে`,
    category: 'warning',
    severity: 'medium',
    duration: 6000,
  }),

  highDiscount: (productName: string, discount: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'high_discount_alert',
    title: '⚠️ উচ্চ ছাড় সতর্কতা',
    message: `${productName} এ ${discount}% ছাড় প্রদান করা হয়েছে`,
    category: 'warning',
    severity: 'medium',
    duration: 5000,
  }),

  expiryApproaching: (productName: string, daysLeft: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'expiry_approaching',
    title: '⏰ মেয়াদ শেষ হওয়ার কাছাকাছি',
    message: `${productName} এর মেয়াদ ${daysLeft} দিনে শেষ হয়ে যাবে`,
    category: 'warning',
    severity: 'medium',
    duration: 6000,
  }),

  customerLimitWarning: (customerName: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'customer_limit_warning',
    title: '⚠️ গ্রাহক সীমা সতর্কতা',
    message: `${customerName} এর ক্রেডিট সীমা অতিক্রম করতে যাচ্ছে`,
    category: 'warning',
    severity: 'medium',
    duration: 5000,
  }),

  // Critical events
  paymentFailed: (amount: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'payment_failed',
    title: '❌ পেমেন্ট ব্যর্থ',
    message: `${amount.toLocaleString('bn-BD')} টাকার পেমেন্ট ব্যর্থ হয়েছে`,
    category: 'error',
    severity: 'critical',
    duration: 0, // persistent
  }),

  systemError: (error: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'system_error',
    title: '🔴 সিস্টেম ত্রুটি',
    message: `সিস্টেমে গুরুতর ত্রুটি ঘটেছে: ${error}`,
    category: 'error',
    severity: 'critical',
    duration: 0, // persistent
  }),

  criticalInventory: (productName: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'critical_inventory',
    title: '🔴 সংকটপূর্ণ ইনভেন্টরি',
    message: `${productName} এর স্টক সংকটপূর্ণ পর্যায়ে নেমে এসেছে`,
    category: 'error',
    severity: 'critical',
    duration: 0, // persistent
  }),

  customerCreditExceeded: (customerName: string, limit: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'customer_credit_exceeded',
    title: '🔴 ক্রেডিট অতিক্রম',
    message: `${customerName} এর ক্রেডিট সীমা (${limit.toLocaleString('bn-BD')} টাকা) অতিক্রম করেছেন`,
    category: 'error',
    severity: 'critical',
    duration: 0, // persistent
  }),

  // Business events
  newCustomer: (customerName: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'new_customer',
    title: '👤 নতুন গ্রাহক',
    message: `${customerName} নতুন গ্রাহক হিসেবে যুক্ত হয়েছেন`,
    category: 'business',
    severity: 'low',
    duration: 4000,
  }),

  largeOrder: (amount: number, quantity: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'large_order',
    title: '📊 বড় অর্ডার',
    message: `${quantity} টি পণ্যের ${amount.toLocaleString('bn-BD')} টাকার বড় অর্ডার পাওয়া গেছে`,
    category: 'business',
    severity: 'low',
    duration: 5000,
  }),

  vipPurchase: (customerName: string, amount: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'vip_customer_purchase',
    title: '⭐ ভিআইপি ক্রয়',
    message: `ভিআইপি গ্রাহক ${customerName} ${amount.toLocaleString('bn-BD')} টাকা ব্যয় করেছেন`,
    category: 'business',
    severity: 'low',
    duration: 5000,
  }),

  // Analytics events
  dailyTargetReached: (target: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'daily_target_reached',
    title: '🎯 দৈনিক লক্ষ্য অর্জন',
    message: `দৈনিক বিক্রয় লক্ষ্য ${target.toLocaleString('bn-BD')} টাকা অর্জিত হয়েছে`,
    category: 'analytics',
    severity: 'low',
    duration: 5000,
  }),

  monthlyMilestone: (achievement: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'monthly_milestone',
    title: '🏆 মাসিক মাইলফলক',
    message: `${achievement} অর্জিত হয়েছে - অভিনন্দন!`,
    category: 'analytics',
    severity: 'low',
    duration: 6000,
  }),

  performanceBoost: (metric: string, increase: number): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'performance_boost',
    title: '📈 পারফরম্যান্স বৃদ্ধি',
    message: `${metric} এ ${increase}% বৃদ্ধি পেয়েছে`,
    category: 'analytics',
    severity: 'low',
    duration: 5000,
  }),

  unusualActivity: (description: string): Omit<Notification, 'id' | 'timestamp'> => ({
    type: 'unusual_activity',
    title: '🔍 অস্বাভাবিক কার্যকলাপ',
    message: `${description}`,
    category: 'warning',
    severity: 'medium',
    duration: 0, // persistent
  }),
};
