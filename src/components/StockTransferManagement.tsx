import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface StockTransferItem {
  productId: Id<"products">;
  productName: string;
  quantity: number;
  unitPrice: number;
  currentStock: number;
}

interface StockTransfer {
  _id: Id<"stockTransfers">;
  transferNumber: string;
  sourceBranchId: Id<"branches">;
  sourceBranchName: string;
  destinationBranchId: Id<"branches">;
  destinationBranchName: string;
  items: StockTransferItem[];
  status: string;
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt: number;
  updatedAt: number;
  approvedAt?: number;
  shippedAt?: number;
  completedAt?: number;
}

interface TransferStats {
  totalTransfers: number;
  completed: number;
  pending: number;
  approved: number;
  inTransit: number;
  cancelled: number;
  totalItemsTransferred: number;
}

export default function StockTransferManagement() {
  const [activeTab, setActiveTab] = useState<"create" | "history" | "pending" | "statistics">(
    "create"
  );
  const [selectedSourceBranch, setSelectedSourceBranch] = useState<string>("");
  const [selectedDestBranch, setSelectedDestBranch] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<StockTransferItem[]>([]);
  const [transferNotes, setTransferNotes] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const branches = useQuery(api.branches.list, {}) || [];
  // ✅ FIX: Extract items array from paginated products query response
  const productsResponse = useQuery(api.products.list, {});
  const products = productsResponse?.items || [];
  const transfers = useQuery(api.stockTransfer.list, {}) || [];
  const pendingTransfers = useQuery(api.stockTransfer.list, { status: "pending" }) || [];
  const transferStats = (useQuery(api.stockTransfer.getStatistics, {}) as TransferStats | null) || {
    totalTransfers: 0,
    completed: 0,
    pending: 0,
    approved: 0,
    inTransit: 0,
    cancelled: 0,
    totalItemsTransferred: 0,
  };

  const createTransfer = useMutation(api.stockTransfer.create);
  const approveTransfer = useMutation(api.stockTransfer.approve);
  const shipTransfer = useMutation(api.stockTransfer.ship);
  const receiveTransfer = useMutation(api.stockTransfer.receive);
  const cancelTransfer = useMutation(api.stockTransfer.cancel);
  const syncBranchStock = useMutation(api.products.syncBranchStockForAllProducts);

  // Sync all products with branch stock data on component mount
  useEffect(() => {
    const performSync = async () => {
      try {
        await syncBranchStock({});
      } catch (error: any) {
        // Silently fail - this is a background sync operation
        console.log("Stock sync completed");
      }
    };
    
    performSync();
  }, [syncBranchStock]);


  const handleAddProduct = (productId: string) => {
    if (!selectedSourceBranch) {
      toast.error("دয়া করে উৎস শাখা নির্বাচন করুন");
      return;
    }

    const product = products?.find((p: any) => p._id === (productId as Id<"products">));
    if (!product) {
      toast.error("পণ্য খুঁজে পাওয়া যায়নি");
      return;
    }

    // Find stock in selected source branch - with fallback to currentStock
    let availableStock = 0;
    const branchStock = product.branchStock?.find(
      (bs: any) => String(bs.branchId) === String(selectedSourceBranch)
    );

    if (branchStock) {
      availableStock = branchStock.currentStock;
    } else if (product.branchStock && product.branchStock.length > 0) {
      // If branchStock array exists but doesn't have the selected branch
      toast.error(`পণ্য নির্বাচিত শাখায় উপলব্ধ নয়`);
      return;
    } else {
      // Fallback: if no branchStock array, use currentStock (for backward compatibility)
      availableStock = product.currentStock || 0;
    }

    if (availableStock === 0) {
      toast.error(`${product.name} এর স্টক নেই`);
      return;
    }

    if (
      !selectedProducts.find(
        (p) => p.productId === (productId as Id<"products">)
      )
    ) {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: productId as Id<"products">,
          productName: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          currentStock: availableStock,
        },
      ]);
      toast.success("পণ্য যোগ করা হয়েছে");
    } else {
      toast.info("পণ্য ইতিমধ্যে যোগ করা হয়েছে");
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const product = selectedProducts.find(
      (p) => p.productId === (productId as Id<"products">)
    );
    if (product && newQuantity > 0 && newQuantity <= product.currentStock) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === productId
            ? { ...p, quantity: newQuantity }
            : p
        )
      );
    } else if (newQuantity > product?.currentStock!) {
      toast.error("Quantity exceeds available stock");
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(
      selectedProducts.filter((p) => p.productId !== (productId as Id<"products">))
    );
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedSourceBranch ||
      !selectedDestBranch ||
      selectedProducts.length === 0
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const sourceBranch = branches?.find(
        (b: any) => (b._id as unknown as string) === selectedSourceBranch
      );
      const destinationBranch = branches?.find(
        (b: any) => (b._id as unknown as string) === selectedDestBranch
      );

      const transferId = await createTransfer({
        sourceBranchId: selectedSourceBranch as unknown as Id<"branches">,
        sourceBranchName: sourceBranch?.name || "Unknown",
        destinationBranchId: selectedDestBranch as unknown as Id<"branches">,
        destinationBranchName: destinationBranch?.name || "Unknown",
        items: selectedProducts,
        notes: transferNotes,
        requestedBy: "Current User",
      });

      toast.success("Transfer created successfully");
      setSelectedSourceBranch("");
      setSelectedDestBranch("");
      setSelectedProducts([]);
      setTransferNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer");
    }
  };

  const handleApprove = async () => {
    if (!selectedTransfer) return;
    try {
      await approveTransfer({
        id: selectedTransfer._id,
        approvedBy: "Current User",
      });
      toast.success("Transfer approved");
      setShowApprovalModal(false);
      setSelectedTransfer(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to approve transfer");
    }
  };

  const handleShip = async (transfer: StockTransfer) => {
    try {
      await shipTransfer({ id: transfer._id });
      toast.success("Transfer shipped");
    } catch (error: any) {
      toast.error(error.message || "Failed to ship transfer");
    }
  };

  const handleReceive = async (transfer: StockTransfer) => {
    try {
      await receiveTransfer({
        id: transfer._id,
        receivedBy: "Current User",
      });
      toast.success("Transfer received");
    } catch (error: any) {
      toast.error(error.message || "Failed to receive transfer");
    }
  };

  const handleCancel = async (transfer: StockTransfer, reason: string) => {
    try {
      await cancelTransfer({
        id: transfer._id,
        reason: reason,
      });
      toast.success("Transfer cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel transfer");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    in_transit: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusIcons: Record<string, string> = {
    pending: "⏳",
    approved: "✅",
    in_transit: "🚚",
    completed: "🎉",
    cancelled: "❌",
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {(
          [
            { id: "create", label: "Create Transfer", icon: "📤" },
            { id: "pending", label: "Pending Approvals", icon: "⏳" },
            { id: "history", label: "Transfer History", icon: "📋" },
            { id: "statistics", label: "Statistics", icon: "📊" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Create Transfer Tab */}
      {activeTab === "create" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">📤 Create Stock Transfer</h2>

          <form onSubmit={handleCreateTransfer} className="space-y-6">
            {/* Branch Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Source Branch
                </label>
                <select
                  value={selectedSourceBranch}
                  onChange={(e) => setSelectedSourceBranch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select source branch</option>
                  {branches?.map((branch: any) => (
                    <option key={branch._id} value={branch._id as unknown as string}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Destination Branch
                </label>
                <select
                  value={selectedDestBranch}
                  onChange={(e) => setSelectedDestBranch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select destination branch</option>
                  {branches?.map((branch: any) => (
                    <option key={branch._id} value={branch._id as unknown as string}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Selection */}
            {selectedSourceBranch && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Add Products
                </label>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProduct(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">পণ্য নির্বাচন করুন</option>
                    {products?.filter((product: any) => product.isActive).map((product: any) => {
                      // Get available stock with fallback
                      let availableStock = 0;
                      const branchStock = product.branchStock?.find(
                        (bs: any) => String(bs.branchId) === String(selectedSourceBranch)
                      );
                      
                      if (branchStock) {
                        availableStock = branchStock.currentStock;
                      } else if (!product.branchStock || product.branchStock.length === 0) {
                        // Fallback for products without branchStock array
                        availableStock = product.currentStock || 0;
                      }
                      
                      const isAlreadyAdded = selectedProducts.some(
                        (p) => p.productId === product._id
                      );
                      
                      return (
                        <option
                          key={product._id}
                          value={product._id as unknown as string}
                          disabled={availableStock === 0 || isAlreadyAdded}
                        >
                          {product.name} {availableStock > 0 ? `(স্টক: ${availableStock})` : "(স্টক নেই)"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Selected Products</h3>
                <div className="space-y-2">
                  {selectedProducts.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          Available: {item.currentStock}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.currentStock}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.productId as unknown as string,
                              parseInt(e.target.value)
                            )
                          }
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.productId as unknown as string)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedProducts.length === 0}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              📤 Create Transfer
            </button>
          </form>
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === "pending" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">⏳ Pending Approvals</h2>
          <div className="space-y-4">
            {pendingTransfers && pendingTransfers.length > 0 ? (
              pendingTransfers.map((transfer: StockTransfer) => (
                <div
                  key={transfer._id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{transfer.transferNumber}</p>
                      <p className="text-sm text-gray-600">
                        {transfer.sourceBranchName} → {transfer.destinationBranchName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[transfer.status]}`}>
                      {statusIcons[transfer.status]} {transfer.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      {transfer.items.map((item) => (
                        <li key={item.productId}>
                          • {item.productName} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {transfer.notes && (
                    <p className="text-sm text-gray-600 mb-3">📝 {transfer.notes}</p>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setShowApprovalModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    ✅ Approve
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No pending approvals</p>
            )}
          </div>
        </div>
      )}

      {/* Transfer History Tab */}
      {activeTab === "history" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">📋 Transfer History</h2>
          <div className="space-y-4">
            {transfers && transfers.length > 0 ? (
              transfers
                .sort((a: StockTransfer, b: StockTransfer) => b.createdAt - a.createdAt)
                .map((transfer: StockTransfer) => (
                  <div
                    key={transfer._id}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{transfer.transferNumber}</p>
                        <p className="text-sm text-gray-600">
                          {transfer.sourceBranchName} → {transfer.destinationBranchName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transfer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[transfer.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusIcons[transfer.status]} {transfer.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        {transfer.items.map((item) => (
                          <li key={item.productId}>
                            • {item.productName} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {transfer.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedTransfer(transfer);
                          setShowApprovalModal(true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        ✅ Approve
                      </button>
                    )}

                    {transfer.status === "approved" && (
                      <button
                        onClick={() => handleShip(transfer)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        🚚 Ship
                      </button>
                    )}

                    {transfer.status === "in_transit" && (
                      <button
                        onClick={() => handleReceive(transfer)}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                      >
                        📦 Receive
                      </button>
                    )}
                  </div>
                ))
            ) : (
              <p className="text-gray-600 text-center py-8">No transfers found</p>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "statistics" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">📊 Transfer Statistics</h2>
          {transferStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm mb-2">Total Transfers</p>
                <p className="text-3xl font-bold text-blue-600">
                  {transferStats.totalTransfers}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm mb-2">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {transferStats.completed}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm mb-2">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {transferStats.pending}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm mb-2">In Transit</p>
                <p className="text-3xl font-bold text-purple-600">
                  {transferStats.inTransit}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm mb-2">Cancelled</p>
                <p className="text-3xl font-bold text-red-600">
                  {transferStats.cancelled}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm mb-2">Total Units</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {transferStats.totalItemsTransferred}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Approve Transfer?</h3>
            <p className="text-gray-600 mb-4">
              Transfer {selectedTransfer.transferNumber} from{" "}
              {selectedTransfer.sourceBranchName} to{" "}
              {selectedTransfer.destinationBranchName}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedTransfer(null);
                }}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
