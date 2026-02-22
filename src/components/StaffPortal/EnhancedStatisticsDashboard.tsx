import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Award, BarChart3, Download, Download as LineChart } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart as RechartLineChart,
  Line,
  BarChart as RechartBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { PdfReportGenerator } from '@/services/PdfReportGenerator';

interface StaffStats {
  staffId: string;
  staffName: string;
  branchId: string;
  branchName: string;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  totalStorageUsed: number;
  averageCompressionRatio: number;
  lastActivityDate: Date;
  likedImages: number;
  approvedImages: number;
}

interface StatsPeriod {
  label: string;
  days: number;
}

interface EnhancedStatisticsDashboardProps {
  staffId?: string;
  branchId?: string;
  onClose?: () => void;
}

const STAT_PERIODS: StatsPeriod[] = [
  { label: 'আজ', days: 1 },
  { label: '৭ দিন', days: 7 },
  { label: '১৪ দিন', days: 14 },
  { label: '৩০ দিন', days: 30 },
  { label: 'সব সময়', days: 365 },
];

// মক ডেটা - Phase 4 এ Convex থেকে আসবে
const MOCK_STATS: StaffStats = {
  staffId: 'staff-001',
  staffName: 'করিম আহমেদ',
  branchId: 'branch-01',
  branchName: 'ঢাকা শাখা',
  totalScans: 145,
  totalUploads: 89,
  totalImages: 156,
  totalStorageUsed: 12.4,
  averageCompressionRatio: 92.3,
  lastActivityDate: new Date(),
  likedImages: 34,
  approvedImages: 142,
};

// গত ৭ দিনের ট্রেন্ড ডেটা
const MOCK_TREND_DATA = [
  { date: 'সোম', scans: 18, uploads: 12, images: 24 },
  { date: 'মঙ্গল', scans: 22, uploads: 15, images: 31 },
  { date: 'বুধ', scans: 19, uploads: 14, images: 28 },
  { date: 'বৃহ', scans: 25, uploads: 18, images: 35 },
  { date: 'শুক্র', scans: 20, uploads: 16, images: 32 },
  { date: 'শনি', scans: 23, uploads: 17, images: 29 },
  { date: 'রবি', scans: 18, uploads: 13, images: 25 },
];

const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

export const EnhancedStatisticsDashboard: React.FC<EnhancedStatisticsDashboardProps> = ({
  staffId,
  branchId,
  onClose,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [stats] = useState<StaffStats>(MOCK_STATS);
  const [showCharts, setShowCharts] = useState(true);

  // পরিসংখ্যান কার্ড উপাদান
  const StatCard = ({
    icon: Icon,
    title,
    value,
    unit = '',
    color = 'blue',
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    unit?: string;
    color?: 'blue' | 'green' | 'purple' | 'red' | 'orange';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-l-4 border-blue-500',
      green: 'bg-green-50 border-l-4 border-green-500',
      purple: 'bg-purple-50 border-l-4 border-purple-500',
      red: 'bg-red-50 border-l-4 border-red-500',
      orange: 'bg-orange-50 border-l-4 border-orange-500',
    };

    const iconColorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
    };

    return (
      <div className={`${colorClasses[color]} p-4 rounded-lg`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {value}
              {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
            </p>
          </div>
          <Icon className={`${iconColorClasses[color]} w-8 h-8`} />
        </div>
      </div>
    );
  };

  const handleDownloadPdf = () => {
    PdfReportGenerator.createStatsPdf(
      stats.staffName,
      stats.branchName,
      {
        totalScans: stats.totalScans,
        totalUploads: stats.totalUploads,
        totalImages: stats.totalImages,
        averageCompressionRatio: stats.averageCompressionRatio,
        likedImages: stats.likedImages,
        approvedImages: stats.approvedImages,
      },
      `stats-${stats.staffId}-${new Date().toISOString().split('T')[0]}.pdf`
    );
    toast.success('পিডিএফ ডাউনলোড শুরু হয়েছে');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* হেডার */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              স্ট্যাটিসটিক্স ড্যাশবোর্ড (Recharts)
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {stats.staffName} • {stats.branchName}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* পিরিয়ড সিলেকশন */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Calendar className="w-4 h-4 inline mr-2" />
          সময়ের পিরিয়ড
        </label>
        <div className="flex gap-2 flex-wrap">
          {STAT_PERIODS.map((period) => (
            <button
              key={period.days}
              onClick={() => setSelectedPeriod(period.days)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedPeriod === period.days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* মূল পরিসংখ্যান */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          title="মোট স্ক্যান"
          value={stats.totalScans}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          title="মোট আপলোড"
          value={stats.totalUploads}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="ছবি সংখ্যা"
          value={stats.totalImages}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          title="স্টোরেজ ব্যবহার"
          value={stats.totalStorageUsed.toFixed(1)}
          unit="MB"
          color="orange"
        />
      </div>

      {/* চার্ট টগল */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            showCharts
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showCharts ? '📊 চার্ট লুকান' : '📊 চার্ট দেখান'}
        </button>
      </div>

      {/* চার্ট সেকশন */}
      {showCharts && (
        <>
          {/* লাইন চার্ট - ট্রেন্ড */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">📈 সাপ্তাহিক ট্রেন্ড</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartLineChart data={MOCK_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="#667eea" strokeWidth={2} />
                <Line type="monotone" dataKey="uploads" stroke="#764ba2" strokeWidth={2} />
                <Line type="monotone" dataKey="images" stroke="#f093fb" strokeWidth={2} />
              </RechartLineChart>
            </ResponsiveContainer>
          </div>

          {/* বার চার্ট - তুলনা */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">📊 কার্যকলাপ তুলনা</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartBarChart data={MOCK_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scans" fill="#667eea" />
                <Bar dataKey="uploads" fill="#764ba2" />
                <Bar dataKey="images" fill="#f093fb" />
              </RechartBarChart>
            </ResponsiveContainer>
          </div>

          {/* পাই চার্ট - বিতরণ */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">🥧 ছবি অনুমোদন বিতরণ</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'অনুমোদিত', value: stats.approvedImages },
                    { name: 'অপেক্ষমান', value: stats.totalImages - stats.approvedImages },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#667eea" />
                  <Cell fill="#f093fb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* বিস্তারিত মেট্রিক্স */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            গড় কম্প্রেশন অনুপাত
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.averageCompressionRatio.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">সাশ্রয়ী স্টোরেজ</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            পছন্দ করা ছবি
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.likedImages}
          </p>
          <p className="text-xs text-gray-600 mt-1">কমিউনিটি এনগেজমেন্ট</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            অনুমোদিত ছবি
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.approvedImages}
          </p>
          <p className="text-xs text-gray-600 mt-1">গুণমান নিয়ন্ত্রণ পাস</p>
        </div>
      </div>

      {/* কার্যকলাপ সারাংশ */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">📊 কার্যকলাপ সারাংশ</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>গড় দৈনিক স্ক্যান:</span>
            <span className="font-semibold">
              {(stats.totalScans / Math.max(selectedPeriod, 1)).toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>গড় দৈনিক আপলোড:</span>
            <span className="font-semibold">
              {(stats.totalUploads / Math.max(selectedPeriod, 1)).toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>প্রতি স্ক্যানে গড় ছবি:</span>
            <span className="font-semibold">
              {(stats.totalImages / Math.max(stats.totalScans, 1)).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>আপলোড সফলতার হার:</span>
            <span className="font-semibold">
              {((stats.approvedImages / Math.max(stats.totalUploads, 1)) * 100).toFixed(
                1
              )}
              %
            </span>
          </div>
        </div>
      </div>

      {/* রপ্তানি বোতাম */}
      <div className="flex gap-2 border-t border-gray-200 pt-4">
        <button
          onClick={handleDownloadPdf}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          পিডিএফ ডাউনলোড করুন
        </button>
        <button
          onClick={() => toast.success('ডেটা ক্লিপবোর্ডে কপি হয়েছে')}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition"
        >
          ডেটা কপি করুন
        </button>
      </div>
    </div>
  );
};
