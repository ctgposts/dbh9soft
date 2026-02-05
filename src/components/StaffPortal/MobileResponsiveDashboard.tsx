import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PdfReportGenerator } from '@/services/PdfReportGenerator';

/**
 * Phase 5: Mobile Responsive Dashboard
 * Optimized for small screens, touch interactions, and offline support
 */

interface MobileStats {
  staffId: string;
  staffName: string;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  approvalRate: number;
  lastUpdate: Date;
}

interface MobileDashboardProps {
  staffId?: string;
  staffName?: string;
  onSync?: () => Promise<void>;
}

const MOBILE_BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 640,
  lg: 1024,
};

export const MobileResponsiveDashboard: React.FC<MobileDashboardProps> = ({
  staffId = 'staff-001',
  staffName = 'করিম আহমেদ',
  onSync,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINTS.md);
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [stats] = useState<MobileStats>({
    staffId,
    staffName,
    totalScans: 145,
    totalUploads: 89,
    totalImages: 156,
    approvalRate: 94.2,
    lastUpdate: new Date(),
  });

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINTS.md);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync handler
  const handleSync = async () => {
    setSyncing(true);
    try {
      if (onSync) {
        await onSync();
      } else {
        // Simulate sync
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setLastSyncTime(new Date());
      toast.success('ডেটা আপডেট সম্পন্ন');
    } catch (error) {
      toast.error('সিঙ্ক ব্যর্থ হয়েছে');
    } finally {
      setSyncing(false);
    }
  };

  // মোবাইল মেনু
  const MobileMenu = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
        menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setMenuOpen(false)}
    >
      <div
        className={`fixed right-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">মেনু</h3>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-3">
          <a
            href="#"
            className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
          >
            📊 ড্যাশবোর্ড
          </a>
          <a
            href="#"
            className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
          >
            📈 রিপোর্ট
          </a>
          <a
            href="#"
            className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
          >
            ⚙️ সেটিংস
          </a>
          <a
            href="#"
            className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium"
          >
            ℹ️ সাহায্য
          </a>
        </nav>
      </div>
    </div>
  );

  // স্ট্যাট কার্ড (মোবাইল অপটিমাইজড)
  const StatCard = ({
    label,
    value,
    icon,
    color = 'blue',
  }: {
    label: string;
    value: number | string;
    icon: string;
    color?: string;
  }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-3 rounded-lg`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* মোবাইল হেডার */}
        <div className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 z-30 shadow-sm">
          <div className="flex items-center justify-between p-3">
            <div>
              <h1 className="text-base font-bold text-gray-800">স্টাফ পোর্টাল</h1>
              <p className="text-xs text-gray-500">{stats.staffName}</p>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* সিঙ্ক স্ট্যাটাস */}
          <div className="px-3 pb-2 flex items-center justify-between text-xs">
            <span className="text-gray-600">
              সর্বশেষ আপডেট: {lastSyncTime.toLocaleTimeString('bn-BD')}
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'সিঙ্ক...' : 'সিঙ্ক'}
            </button>
          </div>
        </div>

        {/* মেনু */}
        <MobileMenu />

        {/* কন্টেন্ট */}
        <div className="pt-24 px-3 space-y-4">
          {/* মূল মেট্রিক্স - ২x২ গ্রিড */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="মোট স্ক্যান"
              value={stats.totalScans}
              icon="📱"
              color="blue"
            />
            <StatCard
              label="মোট আপলোড"
              value={stats.totalUploads}
              icon="📤"
              color="green"
            />
            <StatCard
              label="ছবি সংখ্যা"
              value={stats.totalImages}
              icon="🖼️"
              color="purple"
            />
            <StatCard
              label="অনুমোদন হার"
              value={`${stats.approvalRate}%`}
              icon="✅"
              color="orange"
            />
          </div>

          {/* দ্রুত অ্যাকশন বোতাম */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-800">দ্রুত অ্যাকশন</h3>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <TrendingUp className="w-4 h-4" />
              রিপোর্ট দেখুন
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Download className="w-4 h-4" />
              পিডিএফ ডাউনলোড
            </button>
          </div>

          {/* কার্যকলাপ সারাংশ */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">📊 কার্যকলাপ সারাংশ</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">গড় দৈনিক স্ক্যান:</span>
                <span className="font-semibold text-gray-800">
                  {(stats.totalScans / 30).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">গড় দৈনিক আপলোড:</span>
                <span className="font-semibold text-gray-800">
                  {(stats.totalUploads / 30).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">প্রতি স্ক্যানে গড়:</span>
                <span className="font-semibold text-gray-800">
                  {(stats.totalImages / stats.totalScans).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* নোটিফিকেশন সেকশন */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">🔔 সম্প্রতি</h3>
            <div className="space-y-2">
              <div className="flex gap-2 text-xs">
                <span className="text-blue-600 font-bold">●</span>
                <div>
                  <p className="font-medium text-gray-800">স্ক্যান লক্ষ্য অর্জন</p>
                  <p className="text-gray-600">আজ 145 স্ক্যান সম্পন্ন করেছেন</p>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-600 font-bold">●</span>
                <div>
                  <p className="font-medium text-gray-800">আপলোড সফল</p>
                  <p className="text-gray-600">৮৯টি ছবি আপলোড হয়েছে</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* মোবাইল বটম নেভিগেশন */}
        <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex justify-around items-center">
            <a
              href="#"
              className="flex-1 py-3 flex flex-col items-center text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              📊
              <span>ড্যাশবোর্ড</span>
            </a>
            <a
              href="#"
              className="flex-1 py-3 flex flex-col items-center text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              📈
              <span>রিপোর্ট</span>
            </a>
            <a
              href="#"
              className="flex-1 py-3 flex flex-col items-center text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              ⚙️
              <span>সেটিংস</span>
            </a>
            <a
              href="#"
              className="flex-1 py-3 flex flex-col items-center text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              👤
              <span>প্রফাইল</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ডেস্কটপ ভিউ
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ডেস্কটপ হেডার */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">স্টাফ পোর্টাল</h1>
            <p className="text-gray-600 mt-1">{stats.staffName} - ডেস্কটপ ভিউ</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'সিঙ্ক চলছে...' : 'সিঙ্ক করুন'}
          </button>
        </div>
      </div>

      {/* ডেস্কটপ কন্টেন্ট */}
      <div className="p-6 space-y-6">
        {/* মূল মেট্রিক্স - ৪ কলাম */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="মোট স্ক্যান" value={stats.totalScans} icon="📱" color="blue" />
          <StatCard label="মোট আপলোড" value={stats.totalUploads} icon="📤" color="green" />
          <StatCard label="ছবি সংখ্যা" value={stats.totalImages} icon="🖼️" color="purple" />
          <StatCard
            label="অনুমোদন হার"
            value={`${stats.approvalRate}%`}
            icon="✅"
            color="orange"
          />
        </div>

        {/* সামগ্রী */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-4">📊 বিস্তারিত বিশ্লেষণ</h3>
            <p className="text-gray-600">চার্ট এবং গ্রাফ এখানে প্রদর্শিত হবে</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-3">
            <h3 className="font-bold text-gray-800">দ্রুত লিঙ্ক</h3>
            <a href="#" className="block px-3 py-2 rounded hover:bg-blue-50 text-blue-600 font-medium">
              রিপোর্ট দেখুন
            </a>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-50 text-gray-700">
              পিডিএফ ডাউনলোড
            </a>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-50 text-gray-700">
              সেটিংস
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileResponsiveDashboard;
