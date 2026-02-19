import React, { useState } from "react";
import { Award, Users, Zap, TrendingUp, Crown, Gift, Share2, CheckCircle2, Copy, AlertCircle, UserCheck, Loader, Flame, Target, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LoyaltyCustomer {
  _id: any;
  customerId: any;
  customerName: string;
  email?: string;
  phone?: string;
  currentTier: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints?: number;
  totalSpent: number;
  totalOrders: number;
  referralCode: string;
  referredCustomers?: any[];
  membershipDate: number;
  lastActivityDate?: number;
  isActive?: boolean;
}

interface LoyaltyStats {
  totalMembers: number;
  activeCoupons: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  tierDistribution: Record<string, number>;
}

const TIER_CONFIG = {
  Bronze: { min: 0, max: 1000, color: "from-amber-500 to-amber-600", lightColor: "from-amber-50 to-amber-100", icon: "🥉" },
  Silver: { min: 1000, max: 5000, color: "from-slate-400 to-slate-600", lightColor: "from-slate-50 to-slate-100", icon: "🥈" },
  Gold: { min: 5000, max: 10000, color: "from-yellow-400 to-yellow-600", lightColor: "from-yellow-50 to-yellow-100", icon: "🥇" },
  Platinum: { min: 10000, max: Infinity, color: "from-blue-500 to-purple-600", lightColor: "from-blue-50 to-purple-100", icon: "💎" },
};

const FALLBACK_CUSTOMERS: LoyaltyCustomer[] = [
  {
    _id: "fallback1",
    customerId: "cust1" as any,
    customerName: "Ahmed Hassan",
    email: "ahmed@example.com",
    phone: "+971501234567",
    currentTier: "Gold",
    totalPoints: 5250,
    availablePoints: 3500,
    redeemedPoints: 1750,
    totalSpent: 12500,
    totalOrders: 45,
    referralCode: "AHMED2025",
    membershipDate: new Date("2023-06-15").getTime(),
  },
  {
    _id: "fallback2",
    customerId: "cust2" as any,
    customerName: "Fatima Al-Mansouri",
    email: "fatima@example.com",
    phone: "+971509876543",
    currentTier: "Platinum",
    totalPoints: 8750,
    availablePoints: 6200,
    redeemedPoints: 2550,
    totalSpent: 28900,
    totalOrders: 89,
    referralCode: "FATIMA2025",
    membershipDate: new Date("2022-01-10").getTime(),
  },
  {
    _id: "fallback3",
    customerId: "cust3" as any,
    customerName: "Mohammed Ali",
    email: "mohammed@example.com",
    phone: "+971555555555",
    currentTier: "Silver",
    totalPoints: 2100,
    availablePoints: 1800,
    redeemedPoints: 300,
    totalSpent: 4200,
    totalOrders: 18,
    referralCode: "MOHAMM2025",
    membershipDate: new Date("2023-11-20").getTime(),
  },
];

const FALLBACK_STATS: LoyaltyStats = {
  totalMembers: 156,
  activeCoupons: 12,
  totalPointsIssued: 45000,
  totalPointsRedeemed: 15000,
  tierDistribution: {
    Bronze: 45,
    Silver: 52,
    Gold: 38,
    Platinum: 21,
  },
};

export default function CustomerLoyalty() {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "tiers" | "referral" | "transactions">("overview");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [referralData, setReferralData] = useState({ referredName: "", referredPhone: "", bonusPoints: 100 });
  const [redeemData, setRedeemData] = useState({ pointsToRedeem: 0, reason: "discount" });
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Real data from Convex
  const allCustomers = useQuery(api.loyalty?.getTopCustomers, { limit: 50 }) ?? [];
  const loyaltyStats = useQuery(api.loyalty?.getLoyaltyStats, {}) ?? null;
  const createReferralMutation = useMutation(api.loyalty?.createReferral);
  const redeemPointsMutation = useMutation(api.loyalty?.redeemPoints);

  const customers = (allCustomers && allCustomers.length > 0 ? allCustomers : FALLBACK_CUSTOMERS) as LoyaltyCustomer[];
  const stats = loyaltyStats || FALLBACK_STATS;
  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId) || customers[0];
  const isLoading = !allCustomers || !loyaltyStats;

  React.useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0]._id);
    }
  }, [customers, selectedCustomerId]);

  const getTierConfig = (tier: string) => (TIER_CONFIG as any)[tier] || TIER_CONFIG.Bronze;

  const handleCreateReferral = async () => {
    if (!referralData.referredName || !selectedCustomer?.customerId) {
      toast.error("Please fill in required fields");
      return;
    }
    setIsCreatingReferral(true);
    try {
      await createReferralMutation({
        referrerId: selectedCustomer.customerId as any,
        referrerName: selectedCustomer.customerName,
        referrerPhone: selectedCustomer.phone,
        referredName: referralData.referredName,
        referredPhone: referralData.referredPhone || undefined,
        bonusPoints: referralData.bonusPoints,
      });
      toast.success(`Referral created for ${referralData.referredName}!`);
      setReferralData({ referredName: "", referredPhone: "", bonusPoints: 100 });
      setShowReferralModal(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create referral");
    } finally {
      setIsCreatingReferral(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (redeemData.pointsToRedeem <= 0 || !selectedCustomer?.customerId) {
      toast.error("Invalid points to redeem");
      return;
    }
    if (redeemData.pointsToRedeem > (selectedCustomer?.availablePoints || 0)) {
      toast.error("Insufficient points");
      return;
    }
    setIsRedeeming(true);
    try {
      await redeemPointsMutation({
        customerId: selectedCustomer.customerId as any,
        pointsToRedeem: redeemData.pointsToRedeem,
        reason: redeemData.reason,
      });
      toast.success("Points redeemed successfully!");
      setRedeemData({ pointsToRedeem: 0, reason: "discount" });
      setShowRedeemModal(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to redeem points");
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  // ====================== RENDER ======================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-8 h-8 text-purple-600" />
              Customer Loyalty & Rewards
            </h1>
            <p className="text-sm text-gray-600 mt-1">Manage customer loyalty programs and rewards</p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        {/* Statistics Cards - iOS Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-white/60 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Members</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{isLoading ? "..." : stats.totalMembers}</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Active customers</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">👥</div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-white/60 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Coupons</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{isLoading ? "..." : stats.activeCoupons}</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Running promotions</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">🎁</div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-white/60 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Points Issued</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{isLoading ? "..." : (stats.totalPointsIssued / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Total distributed</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">⚡</div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-white/60 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Redeemed</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{isLoading ? "..." : (stats.totalPointsRedeemed / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Total redeemed</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">✅</div>
            </div>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-sm border border-white/60">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            Tier Distribution
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(TIER_CONFIG).map(([tier, config]: any) => (
              <div key={tier} className={`bg-gradient-to-br ${config.color} rounded-2xl p-4 sm:p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{config.icon} {tier}</h3>
                  <Users className="w-5 h-5 opacity-50" />
                </div>
                <p className="text-3xl font-bold">{isLoading ? "..." : (stats.tierDistribution[tier as keyof typeof stats.tierDistribution] || 0)}</p>
                <p className="text-xs opacity-75 mt-2">Members</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Selection & Tabs */}
        {customers.length > 0 && (
          <>
            {/* Customer Selector */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-sm border border-white/60">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Select Customer</label>
              <select
                value={selectedCustomerId || ""}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium transition-all"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customerName} • {c.currentTier} • {c.totalPoints.toLocaleString()} pts
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="space-y-6">
                {/* Loyalty Card - Premium */}
                <div className={`bg-gradient-to-br ${getTierConfig(selectedCustomer.currentTier).color} rounded-3xl p-6 sm:p-8 text-white shadow-lg`}>
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <div className="flex-1">
                      <p className="text-white/70 text-xs sm:text-sm font-semibold uppercase">Loyalty Member</p>
                      <h3 className="text-2xl sm:text-3xl font-bold mt-2">{selectedCustomer.customerName}</h3>
                      <p className="text-white/60 text-sm mt-1">Member since {new Date(selectedCustomer.membershipDate).getFullYear()}</p>
                    </div>
                    <div className="text-5xl">{getTierConfig(selectedCustomer.currentTier).icon}</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 pb-6 border-b border-white/20">
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Tier</p>
                      <p className="text-xl sm:text-2xl font-bold mt-1">{selectedCustomer.currentTier}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Total Points</p>
                      <p className="text-xl sm:text-2xl font-bold mt-1">{selectedCustomer.totalPoints.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Available</p>
                      <p className="text-xl sm:text-2xl font-bold mt-1">{selectedCustomer.availablePoints.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Redeemed</p>
                      <p className="text-xl sm:text-2xl font-bold mt-1">{(selectedCustomer.redeemedPoints || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Total Spent</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">AED {selectedCustomer.totalSpent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Orders Made</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase">Referral Code</p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm font-mono font-bold bg-white/20 px-2 py-1 rounded flex-1 truncate">{selectedCustomer.referralCode}</code>
                        <button onClick={() => copyToClipboard(selectedCustomer.referralCode)} className="p-2 hover:bg-white/20 rounded transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation - iOS Style */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-1 shadow-sm border border-white/60 flex flex-wrap gap-1">
                  {[
                    { id: "overview", label: "Overview", icon: "👤" },
                    { id: "members", label: "Members", icon: "👥" },
                    { id: "tiers", label: "Tiers", icon: "👑" },
                    { id: "referral", label: "Referral", icon: "🔗" },
                    { id: "transactions", label: "History", icon: "📊" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl transition-all duration-300 font-medium text-xs sm:text-sm ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <span className="mr-1">{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {activeTab === "overview" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 sm:p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-blue-900">This Month</p>
                            <Flame className="w-5 h-5 text-red-500" />
                          </div>
                          <p className="text-3xl font-bold text-blue-700">+450 pts</p>
                          <p className="text-sm text-blue-600 mt-2">From 3 purchases</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4 sm:p-6 border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-green-900">Next Milestone</p>
                            <Target className="w-5 h-5 text-green-600" />
                          </div>
                          <p className="text-3xl font-bold text-green-700">+2,750 pts</p>
                          <p className="text-sm text-green-600 mt-2">To reach Platinum</p>
                        </div>
                      </div>

                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-sm border border-white/60">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => setShowRedeemModal(true)}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300"
                          >
                            <Gift className="w-5 h-5" />
                            Redeem Points
                          </button>
                          <button
                            onClick={() => setShowReferralModal(true)}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300"
                          >
                            <Share2 className="w-5 h-5" />
                            Create Referral
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "members" && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-sm border border-white/60">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Top Customers</h3>
                      <div className="space-y-3">
                        {customers.slice(0, 10).map((customer, idx) => (
                          <div key={customer._id} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 hover:border-slate-300/80 transition-all">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm">{customer.customerName}</p>
                                <p className="text-xs text-gray-600">{customer.currentTier}</p>
                              </div>
                            </div>
                            <p className="font-bold text-gray-900">{customer.totalPoints.toLocaleString()} pts</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "tiers" && (
                    <div className="space-y-3">
                      {Object.entries(TIER_CONFIG).map(([tier, config]: any) => {
                        const isCurrentTier = tier === selectedCustomer.currentTier;
                        return (
                          <div key={tier} className={`rounded-2xl p-4 sm:p-6 border-2 transition-all ${isCurrentTier ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white/50"}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-4xl">{config.icon}</span>
                                <div>
                                  <p className="font-bold text-gray-900">{tier} Member</p>
                                  <p className="text-xs text-gray-600">{config.min.toLocaleString()} - {config.max === Infinity ? "∞" : config.max.toLocaleString()} points</p>
                                </div>
                              </div>
                              {isCurrentTier && <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">CURRENT</span>}
                            </div>
                            <div className="pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-gray-600 font-semibold mb-1">Discount</p>
                                <p className="font-bold text-gray-900">{5 + (Object.keys(TIER_CONFIG).indexOf(tier) * 5)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 font-semibold mb-1">Points Multiplier</p>
                                <p className="font-bold text-gray-900">{1 + Object.keys(TIER_CONFIG).indexOf(tier) * 0.5}x</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 font-semibold mb-1">Benefits</p>
                                <p className="font-bold text-gray-900">{3 + Object.keys(TIER_CONFIG).indexOf(tier)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === "referral" && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-6 sm:p-8 border border-purple-200">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">🔗</div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 mb-1">Your Referral Code</p>
                            <p className="text-sm text-gray-700 mb-4">Share this code to earn 100 bonus points per referral</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-white rounded-lg border border-purple-200 font-mono font-bold text-purple-700 text-sm">{selectedCustomer.referralCode}</code>
                              <button onClick={() => copyToClipboard(selectedCustomer.referralCode)} className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                <Copy className="w-5 h-5 text-purple-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowReferralModal(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Create New Referral
                      </button>

                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/60">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Referred Customers: {(selectedCustomer.referredCustomers?.length || 0)}</p>
                        <div className="space-y-2">
                          {(selectedCustomer.referredCustomers || []).length > 0 ? (
                            (selectedCustomer.referredCustomers || []).map((refId, idx) => (
                              <div key={idx} className="text-xs text-gray-600 p-2 bg-gray-50 rounded-lg">#Referral {idx + 1}</div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No referrals yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "transactions" && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-sm border border-white/60">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Points History</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-2xl border border-green-200">
                          <div>
                            <p className="font-semibold text-green-900 text-sm">Purchase Reward</p>
                            <p className="text-xs text-green-700">From order #1234</p>
                          </div>
                          <p className="font-bold text-green-700">+450</p>
                        </div>
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-200">
                          <div>
                            <p className="font-semibold text-blue-900 text-sm">Referral Bonus</p>
                            <p className="text-xs text-blue-700">From Ahmed's purchase</p>
                          </div>
                          <p className="font-bold text-blue-700">+100</p>
                        </div>
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-2xl border border-red-200">
                          <div>
                            <p className="font-semibold text-red-900 text-sm">Points Redeemed</p>
                            <p className="text-xs text-red-700">For discount coupon</p>
                          </div>
                          <p className="font-bold text-red-700">-250</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Redeem Modal */}
        {showRedeemModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Redeem Points</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Available Points: {selectedCustomer.availablePoints.toLocaleString()}</label>
                  <input type="number" max={selectedCustomer.availablePoints} value={redeemData.pointsToRedeem} onChange={(e) => setRedeemData({ ...redeemData, pointsToRedeem: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Points to redeem" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Reason</label>
                  <select value={redeemData.reason} onChange={(e) => setRedeemData({ ...redeemData, reason: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 outline-none">
                    <option value="discount">Discount</option>
                    <option value="free_product">Free Product</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRedeemModal(false)} disabled={isRedeeming} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleRedeemPoints} disabled={isRedeeming} className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                  {isRedeeming ? <Loader className="w-4 h-4 animate-spin" /> : "Redeem"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Referral Modal */}
        {showReferralModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Referral</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Referred Name *</label>
                  <input type="text" value={referralData.referredName} onChange={(e) => setReferralData({ ...referralData, referredName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                  <input type="tel" value={referralData.referredPhone} onChange={(e) => setReferralData({ ...referralData, referredPhone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 outline-none" placeholder="+971 50 123 4567" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Bonus Points</label>
                  <input type="number" value={referralData.bonusPoints} onChange={(e) => setReferralData({ ...referralData, bonusPoints: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReferralModal(false)} disabled={isCreatingReferral} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleCreateReferral} disabled={isCreatingReferral} className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                  {isCreatingReferral ? <Loader className="w-4 h-4 animate-spin" /> : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

