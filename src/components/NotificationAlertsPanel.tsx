import React, { useState } from 'react';
import { Notification, useNotificationSystem } from '../hooks/useNotificationSystem';
import { audioNotificationService } from '../utils/audioNotifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function NotificationAlertsPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, removeNotification, clearAll, soundEnabled, toggleSound } = useNotificationSystem();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'success' | 'warning' | 'error' | 'business' | 'analytics'>('all');

  const categories = [
    { id: 'all', name: '📋 সব', color: 'bg-gray-100' },
    { id: 'success', name: '✅ সফল', color: 'bg-green-100' },
    { id: 'warning', name: '⚠️ সতর্কতা', color: 'bg-yellow-100' },
    { id: 'error', name: '❌ ত্রুটি', color: 'bg-red-100' },
    { id: 'business', name: '💼 ব্যবসা', color: 'bg-blue-100' },
    { id: 'analytics', name: '📊 বিশ্লেষণ', color: 'bg-purple-100' },
  ];

  const filteredNotifications = selectedCategory === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === selectedCategory);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-4 border-red-500 bg-red-50';
      case 'high': return 'border-l-4 border-orange-500 bg-orange-50';
      case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-50';
      default: return 'border-l-4 border-green-500 bg-green-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      business: '💼',
      analytics: '📊',
      other: '📢',
    };
    return icons[category] || '📢';
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'এখনই';
    if (minutes < 60) return `${minutes} মিনিট আগে`;
    if (hours < 24) return `${hours} ঘণ্টা আগে`;
    return new Date(timestamp).toLocaleDateString('bn-BD');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 top-16 w-96 max-w-full bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <h2 className="font-bold text-lg">সূচনা এবং সতর্কতা</h2>
            <p className="text-xs text-purple-100">{notifications.length} সক্রিয় সূচনা</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-purple-500 rounded-lg transition"
          title="বন্ধ করুন"
        >
          ✕
        </button>
      </div>

      {/* Sound Toggle */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔊</span>
          <span className="text-sm font-medium text-gray-700">সাউন্ড সক্ষম</span>
        </div>
        <button
          onClick={() => toggleSound(!soundEnabled)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
            soundEnabled 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          {soundEnabled ? 'চালু' : 'বন্ধ'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : `${cat.color} text-gray-700 hover:bg-gray-200`
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-2">😊</span>
            <p className="text-sm font-medium">কোনো সূচনা নেই</p>
            <p className="text-xs text-gray-400">সবকিছু ঠিক আছে!</p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`rounded-lg p-3 transition hover:shadow-md ${getSeverityColor(notif.severity)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getCategoryIcon(notif.category)}</span>
                    <h3 className="font-bold text-sm text-gray-900">{notif.title}</h3>
                    {notif.severity === 'critical' && (
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                        জরুরি
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 leading-tight mb-1">{notif.message}</p>
                  <p className="text-xs text-gray-500">{formatTime(notif.timestamp)}</p>
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white rounded transition"
                  title="সরান"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2">
          <button
            onClick={clearAll}
            className="flex-1 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            সব সাফ করুন
          </button>
          <button
            onClick={() => audioNotificationService.play('system_check')}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            পরীক্ষা সাউন্ড
          </button>
        </div>
      )}
    </div>
  );
}

// Notification Icon Component for Dashboard
export function NotificationIcon() {
  const { notifications } = useNotificationSystem();
  const criticalCount = notifications.filter(n => n.severity === 'critical').length;
  const totalCount = notifications.length;

  return (
    <div className="relative">
      <span className="text-2xl">🔔</span>
      {totalCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}
      {criticalCount > 0 && (
        <span className="absolute bottom-0 right-0 bg-orange-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
          !
        </span>
      )}
    </div>
  );
}

// Dashboard Alert Summary Widget
export function DashboardAlertsSummary() {
  const { notifications } = useNotificationSystem();

  const summary = {
    success: notifications.filter(n => n.category === 'success').length,
    warning: notifications.filter(n => n.category === 'warning').length,
    error: notifications.filter(n => n.category === 'error').length,
    business: notifications.filter(n => n.category === 'business').length,
    analytics: notifications.filter(n => n.category === 'analytics').length,
  };

  const criticalAlerts = notifications.filter(n => n.severity === 'critical');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">🔔 সূচনা সারাংশ</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          notifications.length > 0 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {notifications.length} সক্রিয়
        </span>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-bold text-red-800 mb-2">🔴 জরুরি সতর্কতা</p>
          {criticalAlerts.slice(0, 3).map(alert => (
            <p key={alert.id} className="text-xs text-red-700 mb-1">
              • {alert.title}
            </p>
          ))}
          {criticalAlerts.length > 3 && (
            <p className="text-xs text-red-600 font-medium">+{criticalAlerts.length - 3} আরও</p>
          )}
        </div>
      )}

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: '✅ সফল', count: summary.success, color: 'bg-green-100 text-green-800' },
          { label: '⚠️ সতর্কতা', count: summary.warning, color: 'bg-yellow-100 text-yellow-800' },
          { label: '❌ ত্রুটি', count: summary.error, color: 'bg-red-100 text-red-800' },
          { label: '💼 ব্যবসা', count: summary.business, color: 'bg-blue-100 text-blue-800' },
          { label: '📊 বিশ্লেষণ', count: summary.analytics, color: 'bg-purple-100 text-purple-800' },
        ].map((item, idx) => (
          <div key={idx} className={`rounded-lg p-2 text-center ${item.color}`}>
            <p className="text-xs font-medium">{item.label}</p>
            <p className="text-xl font-bold">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Recent Notifications */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs font-bold text-gray-700 mb-2">সাম্প্রতিক সূচনা</p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {notifications.slice(0, 5).map(notif => (
            <div key={notif.id} className="text-xs text-gray-600 p-1 hover:bg-gray-50 rounded">
              <span className="font-medium">{notif.title}</span>
              <span className="text-gray-400"> - {notif.message.substring(0, 40)}...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
