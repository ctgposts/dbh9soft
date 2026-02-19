import React, { useState } from 'react';
import { FileText, Download, Mail, Calendar, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface DailyReportData {
  date: Date;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  totalApprovals: number;
  averageCompressionRatio: number;
  topPerformers: Array<{
    rank: number;
    name: string;
    scans: number;
    uploads: number;
  }>;
  insights: Array<{
    title: string;
    value: string;
    type: 'positive' | 'neutral' | 'warning';
  }>;
  storageUsed: number;
  errorCount: number;
}

interface DailyReportGeneratorProps {
  branchId?: string;
  staffId?: string;
  onClose?: () => void;
}

// মক রিপোর্ট ডেটা
const MOCK_DAILY_REPORT: DailyReportData = {
  date: new Date(),
  totalScans: 45,
  totalUploads: 28,
  totalImages: 72,
  totalApprovals: 68,
  averageCompressionRatio: 92.1,
  topPerformers: [
    { rank: 1, name: 'করিম আহমেদ', scans: 12, uploads: 8 },
    { rank: 2, name: 'ফারিহা রহমান', scans: 10, uploads: 7 },
    { rank: 3, name: 'রহিম খান', scans: 8, uploads: 6 },
  ],
  insights: [
    {
      title: 'সর্বোচ্চ স্ক্যান কার্যকলাপ',
      value: '09:00 - 11:00 সকাল',
      type: 'positive',
    },
    {
      title: 'গড় প্রক্রিয়াকরণ সময়',
      value: '২.৫ মিনিট',
      type: 'positive',
    },
    {
      title: 'অনুমোদন সফলতার হার',
      value: '৯৭.২%',
      type: 'positive',
    },
    {
      title: 'সিস্টেম ত্রুটি',
      value: '০ ত্রুটি',
      type: 'positive',
    },
  ],
  storageUsed: 245.8,
  errorCount: 0,
};

export const DailyReportGenerator: React.FC<DailyReportGeneratorProps> = ({
  branchId,
  staffId,
  onClose,
}) => {
  const [report] = useState<DailyReportData>(MOCK_DAILY_REPORT);
  const [emailRecipients, setEmailRecipients] = useState('manager@example.com');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // সিমুলেট পিডিএফ জেনারেশন
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('দৈনিক রিপোর্ট (পিডিএফ) ডাউনলোড শুরু হয়েছে');
    } catch (error) {
      toast.error('রিপোর্ট তৈরিতে ব্যর্থ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) {
      toast.error('ইমেল ঠিকানা প্রবেশ করুন');
      return;
    }

    setIsSending(true);
    try {
      // সিমুলেট ইমেল পাঠানো
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`রিপোর্ট ${emailRecipients} এ পাঠানো হয়েছে`);
    } catch (error) {
      toast.error('ইমেল পাঠাতে ব্যর্থ');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return new Date(date).toLocaleDateString('bn-BD', options);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto space-y-6">
      {/* হেডার */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-600" />
              দৈনিক রিপোর্ট
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {formatDate(report.date)}
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

      {/* রিপোর্ট সারাংশ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-gray-600 text-sm font-medium">মোট স্ক্যান</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {report.totalScans}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-gray-600 text-sm font-medium">মোট আপলোড</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {report.totalUploads}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-gray-600 text-sm font-medium">ছবি সংখ্যা</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {report.totalImages}
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-gray-600 text-sm font-medium">অনুমোদন হার</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">
            {((report.totalApprovals / report.totalImages) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* প্রধান অন্তর্দৃষ্টি */}
      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          মূল অন্তর্দৃষ্টি
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                insight.type === 'positive'
                  ? 'bg-green-50 border border-green-200'
                  : insight.type === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <p className="text-sm font-semibold text-gray-700">
                {insight.title}
              </p>
              <p
                className={`text-lg font-bold mt-1 ${
                  insight.type === 'positive'
                    ? 'text-green-600'
                    : insight.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                }`}
              >
                {insight.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* শীর্ষ পারফর্মার */}
      <div className="border-l-4 border-yellow-500 pl-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-yellow-600" />
          আজকের শীর্ষ পারফর্মার
        </h3>
        <div className="space-y-2">
          {report.topPerformers.map((performer) => (
            <div
              key={performer.rank}
              className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-yellow-600">
                  {performer.rank === 1
                    ? '🥇'
                    : performer.rank === 2
                      ? '🥈'
                      : '🥉'}
                </span>
                <div>
                  <p className="font-semibold text-gray-800">
                    {performer.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {performer.scans} স্ক্যান • {performer.uploads} আপলোড
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">
                  {performer.scans + performer.uploads}
                </p>
                <p className="text-xs text-gray-600">মোট কার্যকলাপ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* সিস্টেম স্বাস্থ্য */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3">⚙️ সিস্টেম স্বাস্থ্য</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm">স্টোরেজ ব্যবহার</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {report.storageUsed.toFixed(1)} MB
            </p>
            <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: '45%' }}
              ></div>
            </div>
          </div>

          <div>
            <p className="text-gray-600 text-sm">কম্প্রেশন অনুপাত</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {report.averageCompressionRatio}%
            </p>
            <p className="text-xs text-gray-500 mt-2">সাশ্রয়ী</p>
          </div>

          <div>
            <p className="text-gray-600 text-sm">সিস্টেম ত্রুটি</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {report.errorCount}
            </p>
            <p className="text-xs text-gray-500 mt-2">সবকিছু ঠিক আছে</p>
          </div>
        </div>
      </div>

      {/* ইমেল পাঠানো বিভাগ */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          রিপোর্ট ইমেইল করুন
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailRecipients}
            onChange={(e) => setEmailRecipients(e.target.value)}
            placeholder="ইমেল ঠিকানা প্রবেশ করুন"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                পাঠান
              </>
            )}
          </button>
        </div>
      </div>

      {/* ডাউনলোড বোতাম */}
      <div className="flex gap-2 border-t border-gray-200 pt-4">
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              তৈরি করছি...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              পিডিএফ হিসাবে ডাউনলোড করুন
            </>
          )}
        </button>
        <button
          onClick={() => toast.success('রিপোর্ট প্রিন্টের জন্য প্রস্তুত')}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition"
        >
          🖨️ প্রিন্ট করুন
        </button>
      </div>

      {/* তারিখ তথ্য */}
      <div className="text-center text-xs text-gray-500 pt-2">
        <p>
          রিপোর্ট জেনারেট করা হয়েছে{' '}
          {new Date().toLocaleTimeString('bn-BD')}
        </p>
      </div>
    </div>
  );
};
