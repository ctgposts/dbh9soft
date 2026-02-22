import { useQuery, useMutation } from 'convex/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// import { api } from '@/convex/_generated/api';

/**
 * Phase 4 হুক - Convex API সংহতকরণ
 * বর্তমানে mock ডেটা সহ, Phase 4 এ real API কল করবে
 */

// =====================
// স্ট্যাটিসটিক্স হুক
// =====================

export interface StaffStatsData {
  staffId: string;
  staffName: string;
  branchId: string;
  branchName: string;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  totalStorageUsed: number;
  averageCompressionRatio: number;
  likedImages: number;
  approvedImages: number;
  lastActivityDate: Date;
}

export function useStaffStats(
  staffId?: string,
  options?: { period?: number; branchId?: string }
): {
  stats: StaffStatsData | null;
  loading: boolean;
  error: string | null;
} {
  const [stats, setStats] = useState<StaffStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Phase 4: Uncomment এই লাইন এবং mock ডেটা মুছুন
    // const data = useQuery(api.analytics.getStaffStats, {
    //   staffId: staffId || 'current',
    //   days: options?.period || 30,
    //   branchId: options?.branchId,
    // });

    // এখন: Mock ডেটা
    const mockData: StaffStatsData = {
      staffId: staffId || 'staff-001',
      staffName: 'করিম আহমেদ',
      branchId: options?.branchId || 'branch-01',
      branchName: 'ঢাকা শাখা',
      totalScans: 145,
      totalUploads: 89,
      totalImages: 156,
      totalStorageUsed: 12.4,
      averageCompressionRatio: 92.3,
      likedImages: 34,
      approvedImages: 142,
      lastActivityDate: new Date(),
    };

    setStats(mockData);
    setLoading(false);
  }, [staffId, options?.period, options?.branchId]);

  return { stats, loading, error };
}

// =====================
// লিডারবোর্ড হুক
// =====================

export interface LeaderboardEntry {
  rank: number;
  staffId: string;
  staffName: string;
  branchName: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export function useLeaderboard(
  category: 'uploads' | 'scans' | 'compression' | 'quality' | 'engagement' = 'uploads',
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'monthly'
): {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
} {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Phase 4: Uncomment
    // const data = useQuery(api.analytics.getLeaderboard, {
    //   category,
    //   period,
    // });

    // এখন: Mock ডেটা
    const mockData: LeaderboardEntry[] = [
      {
        rank: 1,
        staffId: 'staff-001',
        staffName: 'করিম আহমেদ',
        branchName: 'ঢাকা শাখা',
        score: 234,
        trend: 'up',
        percentage: 100,
      },
      {
        rank: 2,
        staffId: 'staff-002',
        staffName: 'ফারিহা রহমান',
        branchName: 'ঢাকা শাখা',
        score: 198,
        trend: 'up',
        percentage: 85,
      },
      {
        rank: 3,
        staffId: 'staff-003',
        staffName: 'রহিম খান',
        branchName: 'চট্টগ্রাম শাখা',
        score: 187,
        trend: 'down',
        percentage: 80,
      },
    ];

    setLeaderboard(mockData);
    setLoading(false);
  }, [category, period]);

  return { leaderboard, loading, error };
}

// =====================
// দৈনিক রিপোর্ট হুক
// =====================

export interface DailyReportData {
  date: Date;
  totalScans: number;
  totalUploads: number;
  totalImages: number;
  approvalRate: number;
  topPerformers: Array<{
    name: string;
    scans: number;
    uploads: number;
  }>;
  systemHealth: {
    storageUsed: number;
    compressionRatio: number;
    errorCount: number;
  };
}

export function useDailyReport(
  branchId?: string
): {
  report: DailyReportData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    // Phase 4: Uncomment
    // const data = useQuery(api.analytics.getDailyReport, {
    //   branchId: branchId || 'current',
    //   date: new Date(),
    // });

    // এখন: Mock ডেটা
    const mockReport: DailyReportData = {
      date: new Date(),
      totalScans: 45,
      totalUploads: 28,
      totalImages: 72,
      approvalRate: 97.2,
      topPerformers: [
        { name: 'করিম আহমেদ', scans: 12, uploads: 8 },
        { name: 'ফারিহা রহমান', scans: 10, uploads: 7 },
        { name: 'রহিম খান', scans: 8, uploads: 6 },
      ],
      systemHealth: {
        storageUsed: 245.8,
        compressionRatio: 92.1,
        errorCount: 0,
      },
    };

    setReport(mockReport);
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [branchId]);

  return {
    report,
    loading,
    error,
    refresh: fetchReport,
  };
}

// =====================
// ইমেল পাঠানো মিউটেশন
// =====================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  type: 'daily-report' | 'stats' | 'leaderboard';
  data?: Record<string, any>;
}

export function useSendEmail(): {
  send: (options: SendEmailOptions) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const send = async (options: SendEmailOptions) => {
    setLoading(true);
    try {
      // Phase 4: Uncomment
      // const result = await mutation(api.email.sendEmail, options);
      // return result;

      // এখন: Mock পাঠানো
      console.log('ইমেল পাঠানোর চেষ্টা করছি:', options);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('ইমেল সফলভাবে পাঠানো হয়েছে');

      return { success: true };
    } catch (error) {
      const errorMessage = String(error);
      toast.error('ইমেল পাঠাতে ব্যর্থ');
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { send, loading };
}

// =====================
// অনুমোদন ম্যানেজমেন্ট হুক
// =====================

export interface ApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  approvalRate: number;
}

export function useApprovalStats(
  branchId?: string
): {
  stats: ApprovalStats | null;
  loading: boolean;
} {
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Phase 4: Uncomment
    // const data = useQuery(api.analytics.getApprovalStats, {
    //   branchId: branchId || 'current',
    // });

    // এখন: Mock ডেটা
    const mockStats: ApprovalStats = {
      totalPending: 14,
      totalApproved: 142,
      totalRejected: 2,
      approvalRate: 97.2,
    };

    setStats(mockStats);
    setLoading(false);
  }, [branchId]);

  return { stats, loading };
}

// =====================
// সার্চ এবং ফিল্টার হুক
// =====================

export interface SearchResult {
  id: string;
  productName: string;
  barcode: string;
  uploadedBy: string;
  uploadedAt: Date;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

export function useSearchProducts(
  query: string,
  filters?: Record<string, any>
): {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
} {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Phase 4: Uncomment
    // const data = useQuery(api.products.search, {
    //   query,
    //   filters,
    // });

    // এখন: Mock অনুসন্ধান
    const mockResults: SearchResult[] = [
      {
        id: 'img-001',
        productName: 'কটন শার্ট',
        barcode: 'DBH-0001',
        uploadedBy: 'করিম আহমেদ',
        uploadedAt: new Date(),
        approvalStatus: 'approved',
      },
      {
        id: 'img-002',
        productName: 'জিন্স প্যান্ট',
        barcode: 'DBH-0002',
        uploadedBy: 'ফারিহা রহমান',
        uploadedAt: new Date(),
        approvalStatus: 'pending',
      },
    ];

    setResults(mockResults);
    setLoading(false);
  }, [query, filters]);

  return { results, loading, error };
}

// =====================
// সেটিংস সিঙ্ক হুক
// =====================

export interface StaffSettings {
  imageCompressionEnabled: boolean;
  targetImageSize: number;
  jpegQuality: number;
  maxImagesPerProduct: number;
  soundNotifications: boolean;
  vibrationFeedback: boolean;
}

export function useStaffSettings(
  branchId?: string
): {
  settings: StaffSettings | null;
  updateSettings: (settings: Partial<StaffSettings>) => Promise<void>;
  loading: boolean;
} {
  const [settings, setSettings] = useState<StaffSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Phase 4: Uncomment
    // const data = useQuery(api.settings.getStaffSettings, {
    //   branchId: branchId || 'current',
    // });

    // এখন: Mock সেটিংস
    const mockSettings: StaffSettings = {
      imageCompressionEnabled: true,
      targetImageSize: 100,
      jpegQuality: 85,
      maxImagesPerProduct: 3,
      soundNotifications: true,
      vibrationFeedback: true,
    };

    setSettings(mockSettings);
    setLoading(false);
  }, [branchId]);

  const updateSettings = async (updates: Partial<StaffSettings>) => {
    // Phase 4: Uncomment
    // await mutation(api.settings.updateStaffSettings, {
    //   branchId: branchId || 'current',
    //   ...updates,
    // });

    // এখন: Mock আপডেট
    setSettings((prev) => (prev ? { ...prev, ...updates } : null));
    toast.success('সেটিংস আপডেট হয়েছে');
  };

  return { settings, updateSettings, loading };
}
