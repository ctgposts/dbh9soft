import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export default function StockManagement() {
  const [activeTab, setActiveTab] = useState<
    "inventory" | "low-stock" | "value" | "transactions" | "settings"
  >("inventory");
  const [selectedBranch, setSelectedBranch] = useState<Id<"branches"> | "">("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct" | "adjustment">(
    "add"
  );
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const branches = useQuery(api.branches.list, {});
  const branchInventory = useQuery(
    api.stockManagement.getBranchInventory,
    selectedBranch ? { branchId: selectedBranch } : "skip"
  );
  const lowStockItems = useQuery(
    api.stockManagement.getLowStockItems,
    selectedBranch ? { branchId: selectedBranch } : "skip"
  );
  const inventoryValue = useQuery(
    api.stockManagement.getInventoryValue,
    selectedBranch ? { branchId: selectedBranch } : "skip"
  );
  const transactions = useQuery(
    api.stockManagement.getTransactionHistory,
    selectedBranch
      ? { branchId: selectedBranch, limit: 50 }
      : "skip"
  );

  const adjustStock = useMutation(api.stockManagement.adjustStock);
  const setMinMaxLevels = useMutation(api.stockManagement.setMinMaxLevels);

  const handleAdjustStock = async () => {
    if (!selectedProduct || !selectedBranch) {
      toast.error("Please select product and branch");
      return;
    }

    try {
      await adjustStock({
        productId: selectedProduct.productId,
        branchId: selectedBranch,
        quantity: adjustmentQuantity,
        type: adjustmentType,
        reason: adjustmentReason,
      });

      toast.success("Stock adjusted successfully");
      setShowAdjustmentModal(false);
      setSelectedProduct(null);
      setAdjustmentQuantity(1);
      setAdjustmentReason("");
      setAdjustmentType("add");
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust stock");
    }
  };

  const handleSetLevels = async (product: any, minLevel: number, maxLevel: number) => {
    if (!selectedBranch) return;

    try {
      await setMinMaxLevels({
        productId: product.productId,
        branchId: selectedBranch,
        minStockLevel: minLevel,
        maxStockLevel: maxLevel,
      });

      toast.success("Stock levels updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update levels");
    }
  };

  return (
    <div className="space-y-6">
      {/* Branch Selection */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <label className="block text-sm font-medium mb-2">Select Branch</label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value as Id<"branches">)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Branches</option>
          {branches?.map((branch: any) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto">
        {(
          [
            { id: "inventory", label: "Inventory", icon: "📦" },
            { id: "low-stock", label: "Low Stock", icon: "⚠️" },
            { id: "value", label: "Stock Value", icon: "💰" },
            { id: "transactions", label: "Transactions", icon: "📋" },
            { id: "settings", label: "Settings", icon: "⚙️" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {activeTab === "inventory" && selectedBranch && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">📦 Branch Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Brand</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Min Level</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Max Level</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {branchInventory?.map((product: any) => (
                  <tr key={product.productId} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-xs text-gray-600">{product.productCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">{product.brand}</td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {product.currentStock}
                    </td>
                    <td className="px-6 py-3 text-right text-sm">{product.minStockLevel}</td>
                    <td className="px-6 py-3 text-right text-sm">{product.maxStockLevel}</td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.status === "low"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.status === "low" ? "⚠️ Low" : "✅ Normal"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowAdjustmentModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === "low-stock" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">⚠️ Low Stock Items</h2>
          </div>
          {lowStockItems && lowStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Branch</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Current</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Min Level</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Shortage</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item: any) => (
                    <tr key={`${item.productId}-${item.branchId}`} className="border-b hover:bg-red-50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-600">{item.productCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">{item.branchName || item.branchId}</td>
                      <td className="px-6 py-3 text-right font-bold text-red-600">
                        {item.currentStock}
                      </td>
                      <td className="px-6 py-3 text-right text-sm">{item.minStockLevel}</td>
                      <td className="px-6 py-3 text-right font-bold text-red-600">
                        -{item.shortage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-600">
              ✅ All items are well-stocked
            </div>
          )}
        </div>
      )}

      {/* Stock Value Tab */}
      {activeTab === "value" && selectedBranch && inventoryValue && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">Total Units</p>
            <p className="text-4xl font-bold text-blue-600">{inventoryValue.totalUnits}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">Total Cost Value</p>
            <p className="text-4xl font-bold text-green-600">
              ৳{inventoryValue.totalCostValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">Total Retail Value</p>
            <p className="text-4xl font-bold text-purple-600">
              ৳{inventoryValue.totalRetailValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">Total Margin</p>
            <p className="text-4xl font-bold text-orange-600">
              ৳{inventoryValue.margin.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {inventoryValue.marginPercentage.toFixed(2)}% profit margin
            </p>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && selectedBranch && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">📋 Recent Transactions</h2>
          </div>
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Notes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: any) => (
                    <tr key={transaction._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="font-medium">{transaction.productName}</p>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                          {transaction.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {transaction.type.includes("out") ||
                        transaction.type === "deduct" ? (
                          <span className="text-red-600">-{transaction.quantity}</span>
                        ) : (
                          <span className="text-green-600">+{transaction.quantity}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {transaction.notes}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-600">
              No transactions found
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && selectedBranch && branchInventory && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">⚙️ Stock Level Settings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Current</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Min Level</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Max Level</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {branchInventory.map((product: any) => (
                  <SettingsRow
                    key={product.productId}
                    product={product}
                    onSetLevels={handleSetLevels}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Adjust Stock - {selectedProduct.productName}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Adjustment Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) =>
                    setAdjustmentType(e.target.value as typeof adjustmentType)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="add">Add Stock</option>
                  <option value="deduct">Deduct Stock</option>
                  <option value="adjustment">Set to Exact Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Why are you adjusting this stock?"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAdjustmentModal(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustStock}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Adjust
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsRow({
  product,
  onSetLevels,
}: {
  product: any;
  onSetLevels: (product: any, min: number, max: number) => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [minLevel, setMinLevel] = useState(product.minStockLevel);
  const [maxLevel, setMaxLevel] = useState(product.maxStockLevel);

  if (!showEdit) {
    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="px-6 py-3">
          <p className="font-medium">{product.productName}</p>
        </td>
        <td className="px-6 py-3 text-right text-sm">{product.currentStock}</td>
        <td className="px-6 py-3 text-right text-sm">{product.minStockLevel}</td>
        <td className="px-6 py-3 text-right text-sm">{product.maxStockLevel}</td>
        <td className="px-6 py-3 text-center">
          <button
            onClick={() => setShowEdit(true)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Edit
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b bg-blue-50">
      <td className="px-6 py-3">
        <p className="font-medium">{product.productName}</p>
      </td>
      <td className="px-6 py-3 text-right text-sm">{product.currentStock}</td>
      <td className="px-6 py-3 text-right">
        <input
          type="number"
          min="0"
          value={minLevel}
          onChange={(e) => setMinLevel(parseInt(e.target.value))}
          className="w-20 px-2 py-1 border rounded text-right"
        />
      </td>
      <td className="px-6 py-3 text-right">
        <input
          type="number"
          min="0"
          value={maxLevel}
          onChange={(e) => setMaxLevel(parseInt(e.target.value))}
          className="w-20 px-2 py-1 border rounded text-right"
        />
      </td>
      <td className="px-6 py-3 text-center space-x-2">
        <button
          onClick={() => {
            onSetLevels(product, minLevel, maxLevel);
            setShowEdit(false);
          }}
          className="text-green-600 hover:text-green-800 font-medium text-sm"
        >
          Save
        </button>
        <button
          onClick={() => {
            setMinLevel(product.minStockLevel);
            setMaxLevel(product.maxStockLevel);
            setShowEdit(false);
          }}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}
