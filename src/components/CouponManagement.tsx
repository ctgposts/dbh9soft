import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Tag,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabType[] = [
  { id: "all", label: "All Coupons", icon: <Ticket className="w-4 h-4" /> },
  { id: "active", label: "Active", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "upcoming", label: "Upcoming", icon: <Clock className="w-4 h-4" /> },
  { id: "stats", label: "Statistics", icon: <TrendingUp className="w-4 h-4" /> },
];

export default function CouponManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usagePerCustomer: 1,
    maxUsageCount: 0,
    validFrom: Math.floor(Date.now() / 1000),
    validUntil: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    applicableBranches: [] as string[],
    loyaltyTiersRequired: [] as string[],
    requiresLoyaltyPoints: 0,
  });

  // Queries
  const coupons = useQuery(api.coupons.list, {}) || [];
  const categories = useQuery(api.categories.list, {}) || [];
  const branches = useQuery(api.branches.list, {}) || [];
  const products = useQuery(api.products.list, {}) || [];

  // Mutations
  const createCouponMutation = useMutation(api.coupons.create);
  const updateCouponMutation = useMutation(api.coupons.update);
  const deleteCouponMutation = useMutation(api.coupons.delete_);

  const filteredCoupons = (coupons || []).filter((coupon: any) => {
    const matchSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "active") {
      const now = Date.now();
      return (
        matchSearch &&
        coupon.isActive &&
        coupon.validFrom <= now &&
        coupon.validUntil >= now
      );
    } else if (activeTab === "upcoming") {
      const now = Date.now();
      return matchSearch && coupon.validFrom > now;
    }

    return matchSearch;
  });

  const handleCreateCoupon = async () => {
    if (!formData.code || formData.discountValue <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingCoupon) {
        await updateCouponMutation({
          id: editingCoupon._id,
          code: formData.code,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minOrderAmount: formData.minOrderAmount > 0 ? formData.minOrderAmount : undefined,
          maxUsageCount: formData.maxUsageCount > 0 ? formData.maxUsageCount : undefined,
          validFrom: Math.floor(formData.validFrom * 1000),
          validUntil: Math.floor(formData.validUntil * 1000),
          isActive: true,
        });
        toast.success("Coupon updated successfully!");
      } else {
        await createCouponMutation({
          code: formData.code,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minOrderAmount: formData.minOrderAmount > 0 ? formData.minOrderAmount : undefined,
          maxUsageCount: formData.maxUsageCount > 0 ? formData.maxUsageCount : undefined,
          validFrom: Math.floor(formData.validFrom * 1000),
          validUntil: Math.floor(formData.validUntil * 1000),
          applicableProducts: formData.applicableProducts.length > 0 
            ? (formData.applicableProducts as Id<"products">[]) 
            : undefined,
          applicableCategories: formData.applicableCategories.length > 0 
            ? (formData.applicableCategories as Id<"categories">[]) 
            : undefined,
        });
        toast.success("Coupon created successfully!");
      }
      resetForm();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save coupon");
    }
  };

  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usagePerCustomer: coupon.usagePerCustomer || 1,
      maxUsageCount: coupon.maxUsageCount || 0,
      validFrom: Math.floor(coupon.validFrom / 1000),
      validUntil: Math.floor(coupon.validUntil / 1000),
      applicableProducts: coupon.applicableProducts || [],
      applicableCategories: coupon.applicableCategories || [],
      applicableBranches: coupon.applicableBranches || [],
      loyaltyTiersRequired: coupon.loyaltyTiersRequired || [],
      requiresLoyaltyPoints: coupon.requiresLoyaltyPoints || 0,
    });
    setShowModal(true);
  };

  const handleDeleteCoupon = async (couponId: Id<"coupons">) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      await deleteCouponMutation({ id: couponId });
      toast.success("Coupon deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usagePerCustomer: 1,
      maxUsageCount: 0,
      validFrom: Math.floor(Date.now() / 1000),
      validUntil: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      applicableProducts: [],
      applicableCategories: [],
      applicableBranches: [],
      loyaltyTiersRequired: [],
      requiresLoyaltyPoints: 0,
    });
    setEditingCoupon(null);
  };

  const getStatusBadge = (coupon: any) => {
    const now = Date.now();
    if (!coupon.isActive) {
      return { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" };
    }
    if (coupon.validUntil < now) {
      return { bg: "bg-red-100", text: "text-red-800", label: "Expired" };
    }
    if (coupon.validFrom > now) {
      return { bg: "bg-yellow-100", text: "text-yellow-800", label: "Upcoming" };
    }
    return { bg: "bg-green-100", text: "text-green-800", label: "Active" };
  };

  const getDiscountDisplay = (coupon: any) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    } else if (coupon.discountType === "fixed") {
      return `$${coupon.discountValue}`;
    } else if (coupon.discountType === "free_shipping") {
      return "Free Shipping";
    }
    return "Discount";
  };

  const getUsagePercentage = (coupon: any) => {
    if (!coupon.maxUsageCount) return 0;
    return (coupon.usageCount / coupon.maxUsageCount) * 100;
  };

  const calculateStatistics = () => {
    const now = Date.now();
    const activeCoupons = filteredCoupons.filter(
      (c: any) => c.isActive && c.validFrom <= now && c.validUntil >= now
    );
    const totalUsage = filteredCoupons.reduce((sum: number, c: any) => sum + c.usageCount, 0);
    const avgDiscount =
      filteredCoupons.reduce((sum: number, c: any) => sum + c.discountValue, 0) /
      filteredCoupons.length;

    return {
      activeCoupons: activeCoupons.length,
      totalCoupons: filteredCoupons.length,
      totalUsage,
      avgDiscount: avgDiscount.toFixed(2),
    };
  };

  const stats = calculateStatistics();

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-8 h-8 text-blue-600" />
              Coupon Management
            </h1>
            <p className="text-slate-600 mt-2">Create and manage promotional coupons</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Coupon
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Coupons</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCoupons}</p>
                </div>
                <Ticket className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeCoupons}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Usage</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalUsage}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Avg Discount</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">${stats.avgDiscount}</p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-slate-200 flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Search & Filters */}
            {activeTab !== "stats" && (
              <div className="mb-6 flex gap-4">
                <input
                  type="text"
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* All Coupons Tab */}
            {activeTab === "all" && (
              <div>
                {filteredCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCoupons.map((coupon: any) => {
                      const status = getStatusBadge(coupon || {});
                      const usagePercent = getUsagePercentage(coupon || {});
                      return (
                        <div
                          key={coupon?._id || Math.random()}
                          className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-slate-900 font-mono">
                                  {coupon?.code || "N/A"}
                                </h3>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}
                                >
                                  {status.label}
                                </span>
                              </div>
                              {coupon?.description && (
                                <p className="text-sm text-slate-600">{coupon.description}</p>
                              )}
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">
                                  {getDiscountDisplay(coupon || {})}
                                </p>
                                <p className="text-xs text-slate-600">Discount</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditCoupon(coupon)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Edit coupon"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon?._id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Delete coupon"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Usage Progress */}
                          {(coupon?.maxUsageCount || 0) > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-slate-700">Usage</p>
                                <p className="text-xs text-slate-600">
                                  {coupon?.usageCount || 0} / {coupon?.maxUsageCount || 0}
                                </p>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-3 border-y border-slate-200">
                            <div>
                              <p className="text-xs text-slate-600">Min Order</p>
                              <p className="font-semibold text-slate-900">
                                {coupon?.minOrderAmount ? `$${coupon.minOrderAmount}` : "No Limit"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Valid From</p>
                              <p className="font-semibold text-slate-900 text-sm">
                                {coupon?.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Valid Until</p>
                              <p className="font-semibold text-slate-900 text-sm">
                                {coupon?.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Created By</p>
                              <p className="font-semibold text-slate-900 text-sm">
                                {coupon?.createdByName || "System"}
                              </p>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {coupon?.loyaltyTiersRequired && coupon.loyaltyTiersRequired.length > 0 && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                Tiers: {coupon.loyaltyTiersRequired.join(", ")}
                              </span>
                            )}
                            {coupon?.applicableCategories && coupon.applicableCategories.length > 0 && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                {coupon.applicableCategories.length} Categories
                              </span>
                            )}
                            {coupon?.applicableProducts && coupon.applicableProducts.length > 0 && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                {coupon.applicableProducts.length} Products
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">No coupons found</p>
                  </div>
                )}
              </div>
            )}

            {/* Active Coupons Tab */}
            {activeTab === "active" && (
              <div>
                {filteredCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCoupons.map((coupon: any) => (
                      <div
                        key={coupon?._id || Math.random()}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">{coupon?.code || "N/A"}</h3>
                            <p className="text-sm text-slate-600">{coupon?.description || ""}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {getDiscountDisplay(coupon || {})}
                            </p>
                            <p className="text-xs text-slate-600">
                              Used: {coupon?.usageCount || 0} times
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">No active coupons</p>
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Coupons Tab */}
            {activeTab === "upcoming" && (
              <div>
                {filteredCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCoupons.map((coupon: any) => (
                      <div
                        key={coupon?._id || Math.random()}
                        className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">{coupon?.code || "N/A"}</h3>
                            <p className="text-sm text-slate-600">
                              Starts: {coupon?.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-600">
                              {getDiscountDisplay(coupon || {})}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">No upcoming coupons</p>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Discount Type Distribution</p>
                    <div className="space-y-2">
                      {["percentage", "fixed", "free_shipping"].map((type) => {
                        const count = filteredCoupons.filter((c: any) => c.discountType === type).length;
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Overall Usage Rate</p>
                    <div className="text-4xl font-bold text-blue-600">
                      {filteredCoupons.length > 0
                        ? (
                            (filteredCoupons.reduce((sum: number, c: any) => sum + c.usageCount, 0) /
                              (filteredCoupons.reduce((sum: number, c: any) => sum + (c.maxUsageCount || c.usageCount + 1), 0) || 1)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-4">Top Performing Coupons</p>
                  <div className="space-y-2">
                    {filteredCoupons
                      .sort((a: any, b: any) => (b?.usageCount || 0) - (a?.usageCount || 0))
                      .slice(0, 5)
                      .map((coupon: any, idx: number) => (
                        <div key={coupon?._id || idx} className="flex items-center justify-between p-2 bg-white rounded">
                          <span className="font-mono font-bold">{coupon?.code || "N/A"}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">{coupon?.usageCount || 0} uses</span>
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    ((coupon?.usageCount || 0) /
                                      (filteredCoupons[0]?.usedCount || 1)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SUMMER2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="points">Loyalty Points</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Summer sale discount"
                />
              </div>

              {/* Discount Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.discountType === "percentage" ? "15" : "50"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Discount Amount
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Usage per Customer
                  </label>
                  <input
                    type="number"
                    value={formData.usagePerCustomer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usagePerCustomer: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Usage Limit (0 = Unlimited)
                </label>
                <input
                  type="number"
                  value={formData.maxUsageCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUsageCount: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={new Date(formData.validFrom * 1000).toISOString().split("T")[0]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validFrom: Math.floor(new Date(e.target.value).getTime() / 1000),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={new Date(formData.validUntil * 1000).toISOString().split("T")[0]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validUntil: Math.floor(new Date(e.target.value).getTime() / 1000),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Loyalty Requirements */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loyalty Tiers Required (Optional)
                </label>
                <div className="space-y-2">
                  {["Bronze", "Silver", "Gold", "Platinum"].map((tier) => (
                    <label key={tier} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.loyaltyTiersRequired.includes(tier)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              loyaltyTiersRequired: [
                                ...formData.loyaltyTiersRequired,
                                tier,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              loyaltyTiersRequired: formData.loyaltyTiersRequired.filter(
                                (t) => t !== tier
                              ),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-slate-700">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Loyalty Points Required (Optional)
                </label>
                <input
                  type="number"
                  value={formData.requiresLoyaltyPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresLoyaltyPoints: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCoupon}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
