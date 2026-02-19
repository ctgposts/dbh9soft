import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export default function DiscountManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Id<"discounts"> | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "all" | "stats">("all");

  const discounts = useQuery(api.discounts.list, {});
  const categories = useQuery(api.categories.list);
  // ✅ FIX: Extract items array from paginated products query response
  const productsResponse = useQuery(api.products.list, {});
  const products = productsResponse?.items || [];
  const branches = useQuery(api.branches.list, {});
  const discountStats = useQuery(api.discountUtils.getDiscountStats, {});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed_amount",
    value: 0,
    scope: "all_products" as "all_products" | "category" | "specific_products",
    categoryIds: [] as Id<"categories">[],
    productIds: [] as Id<"products">[],
    branchIds: [] as Id<"branches">[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: undefined as number | undefined,
    minPurchaseAmount: undefined as number | undefined,
    maxDiscountAmount: undefined as number | undefined,
  });

  const createDiscount = useMutation(api.discounts.create);
  const updateDiscount = useMutation(api.discounts.update);
  const removeDiscount = useMutation(api.discounts.remove);
  const toggleDiscountStatus = useMutation(api.discountUtils.toggleDiscountStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        startDate: new Date(formData.startDate).getTime(),
        endDate: new Date(formData.endDate).getTime(),
      };

      if (showEditModal && selectedDiscount) {
        const discount = discounts?.find(d => d._id === selectedDiscount);
        await updateDiscount({
          id: selectedDiscount,
          ...data,
          isActive: discount?.isActive ?? true,
        });
        toast.success("Discount updated successfully!");
      } else {
        await createDiscount(data);
        toast.success("Discount created successfully!");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save discount");
    }
  };

  const handleEdit = (discountId: Id<"discounts">) => {
    const discount = discounts?.find(d => d._id === discountId);
    if (discount) {
      setFormData({
        name: discount.name,
        description: discount.description || "",
        type: discount.type as any,
        value: discount.value,
        scope: discount.scope as any,
        categoryIds: discount.categoryIds || [],
        productIds: discount.productIds || [],
        branchIds: discount.branchIds || [],
        startDate: new Date(discount.startDate).toISOString().split('T')[0],
        endDate: new Date(discount.endDate).toISOString().split('T')[0],
        usageLimit: discount.usageLimit,
        minPurchaseAmount: discount.minPurchaseAmount,
        maxDiscountAmount: discount.maxDiscountAmount,
      });
      setSelectedDiscount(discountId);
      setShowEditModal(true);
    }
  };

  const handleToggleStatus = async (discountId: Id<"discounts">, currentStatus: boolean) => {
    try {
      await toggleDiscountStatus({
        discountId,
        isActive: !currentStatus,
      });
      toast.success(`Discount ${!currentStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle discount status");
    }
  };

  const handleDelete = async (discountId: Id<"discounts">) => {
    if (confirm("Are you sure you want to delete this discount?")) {
      try {
        await removeDiscount({ id: discountId });
        toast.success("Discount deleted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete discount");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      scope: "all_products",
      categoryIds: [],
      productIds: [],
      branchIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: undefined,
      minPurchaseAmount: undefined,
      maxDiscountAmount: undefined,
    });
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedDiscount(null);
  };

  // Filter discounts based on active tab
  const filteredDiscounts = discounts?.filter((discount) => {
    const isActive = discount.isActive && 
      discount.startDate <= Date.now() && 
      discount.endDate >= Date.now();
    
    if (activeTab === "active") {
      return isActive;
    }
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">🎁 Discount Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage promotional discounts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:w-auto w-full"
        >
          ➕ Create Discount
        </button>
      </div>

      {/* Statistics Cards */}
      {discountStats && activeTab === "stats" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-100/50">
            <div className="text-3xl font-bold text-blue-700">{discountStats.total}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mt-2">Total Discounts</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-100/50">
            <div className="text-3xl font-bold text-green-700">{discountStats.active}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mt-2">Active Now</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-5 border border-yellow-100/50">
            <div className="text-3xl font-bold text-yellow-700">{discountStats.upcoming}</div>
            <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mt-2">Upcoming</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-5 border border-red-100/50">
            <div className="text-3xl font-bold text-red-700">{discountStats.expired}</div>
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mt-2">Expired</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-100/50">
            <div className="text-3xl font-bold text-purple-700">{discountStats.totalUsage}</div>
            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mt-2">Total Used</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === "all"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Discounts ({discounts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "active"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Active Now ({filteredDiscounts.length})
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "stats"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Statistics
          </button>
        </nav>
      </div>

      {/* Discounts List */}
      {activeTab !== "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiscounts.length > 0 ? (
            filteredDiscounts.map((discount) => {
              const isActive = discount.isActive && 
                discount.startDate <= Date.now() && 
                discount.endDate >= Date.now();
              const isExpired = discount.endDate < Date.now();
              const isUpcoming = discount.startDate > Date.now();
              const percentageUsed = discount.usageLimit
                ? Math.round((discount.usageCount / discount.usageLimit) * 100)
                : 0;
              
              return (
                <div key={discount._id} className="bg-white rounded-lg shadow p-6 space-y-4 border border-gray-200">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{discount.name}</h3>
                      {discount.description && (
                        <p className="text-sm text-gray-600 mt-1">{discount.description}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : isExpired
                        ? 'bg-red-100 text-red-800'
                        : isUpcoming
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isActive ? '✓ Active' : isExpired ? '✕ Expired' : isUpcoming ? '⏱ Upcoming' : '⊘ Inactive'}
                    </span>
                  </div>

                  {/* Discount Value */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {discount.type === "percentage" ? `${discount.value}%` : `৳${discount.value}`}
                    </div>
                    <div className="text-sm text-purple-800">
                      {discount.scope === "all_products"
                        ? "All Products"
                        : discount.scope === "category"
                        ? "Specific Categories"
                        : "Specific Products"}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex justify-between text-gray-700">
                      <span>Valid:</span>
                      <span className="font-medium">
                        {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {discount.usageLimit && (
                      <div>
                        <div className="flex justify-between text-gray-700 mb-1">
                          <span>Usage:</span>
                          <span className="font-medium">{discount.usageCount} / {discount.usageLimit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentageUsed > 80
                                ? 'bg-red-500'
                                : percentageUsed > 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {discount.minPurchaseAmount && (
                      <div className="flex justify-between text-gray-700">
                        <span>Min Purchase:</span>
                        <span className="font-medium">৳{discount.minPurchaseAmount}</span>
                      </div>
                    )}

                    {discount.maxDiscountAmount && (
                      <div className="flex justify-between text-gray-700">
                        <span>Max Discount:</span>
                        <span className="font-medium">৳{discount.maxDiscountAmount}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleToggleStatus(discount._id, discount.isActive)}
                      className={`flex-1 text-sm py-2 rounded font-medium transition ${
                        discount.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {discount.isActive ? '⊘ Deactivate' : '✓ Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(discount._id)}
                      className="flex-1 text-sm py-2 rounded font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(discount._id)}
                      className="flex-1 text-sm py-2 rounded font-medium bg-red-100 text-red-800 hover:bg-red-200 transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-lg">
                {activeTab === "active" ? "No active discounts" : "No discounts created yet"}
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                ➕ Create Your First Discount
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {showEditModal ? "Edit Discount" : "Create New Discount"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-field"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="input-field"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (৳)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value *
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apply To *
                    </label>
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                      className="input-field"
                      required
                    >
                      <option value="all_products">All Products</option>
                      <option value="category">Specific Categories</option>
                      <option value="specific_products">Specific Products</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit || ""}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="input-field"
                      min="0"
                      placeholder="Unlimited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Purchase Amount (৳)
                    </label>
                    <input
                      type="number"
                      value={formData.minPurchaseAmount || ""}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="input-field"
                      min="0"
                      step="0.01"
                      placeholder="No minimum"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Discount Amount (৳)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount || ""}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="input-field"
                      min="0"
                      step="0.01"
                      placeholder="No maximum"
                    />
                  </div>

                  {/* Category Selection */}
                  {formData.scope === "category" && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Categories *
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                        {categories?.map((category) => (
                          <label key={category._id} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.categoryIds.includes(category._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    categoryIds: [...formData.categoryIds, category._id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    categoryIds: formData.categoryIds.filter(id => id !== category._id),
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Selection */}
                  {formData.scope === "specific_products" && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Products *
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                        {products?.map((product) => (
                          <label key={product._id} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.productIds.includes(product._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    productIds: [...formData.productIds, product._id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    productIds: formData.productIds.filter(id => id !== product._id),
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {product.name} {product.brand && `(${product.brand})`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {showEditModal ? "Update" : "Create"} Discount
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
