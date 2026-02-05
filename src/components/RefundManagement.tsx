import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function RefundManagement() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchSaleNumber, setSearchSaleNumber] = useState("");

  // ✅ Query sales - THIS WAS MISSING!
  const sales = useQuery(api.sales.list, { limit: 200 }) || [];

  // ✅ Query refunds
  const refunds = useQuery(api.refunds.list, {
    status: statusFilter === "all" ? undefined : statusFilter,
  }) || [];

  const pendingRefunds = useQuery(api.refunds.getPendingApproval, {}) || [];

  // ✅ Mutations
  const createRefund = useMutation(api.refunds.create);
  const approveRefund = useMutation(api.refunds.approve);
  const rejectRefund = useMutation(api.refunds.reject);
  const processRefund = useMutation(api.refunds.process);
  const completeRefund = useMutation(api.refunds.complete);

  // ✅ Form state
  const [refundForm, setRefundForm] = useState({
    selectedItems: [] as string[], // product IDs
    refundMethod: "cash" as "cash" | "mobile_banking" | "card" | "credit_account",
    refundReason: "quality_issue" as string,
    refundNotes: "",
    restockRequired: true,
  });

  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [returnCondition, setReturnCondition] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");

  // ✅ Filter sales for search
  const filteredSales = sales.filter(
    (sale) =>
      sale.saleNumber.toLowerCase().includes(searchSaleNumber.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchSaleNumber.toLowerCase()))
  );

  // ✅ Get items from selected sale
  const saleItems = selectedSale?.items || [];

  // ✅ Calculate refund amount
  const calculateRefundAmount = () => {
    if (!selectedSale || refundForm.selectedItems.length === 0) return 0;
    const selectedItemsData = saleItems.filter((item: any) =>
      refundForm.selectedItems.includes(item.productId)
    );
    return selectedItemsData.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  };

  // ✅ Toggle item selection
  const toggleItemSelection = (productId: string) => {
    setRefundForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(productId)
        ? prev.selectedItems.filter((id) => id !== productId)
        : [...prev.selectedItems, productId],
    }));
  };

  // ✅ Create refund - FIXED!
  const handleCreateRefund = async () => {
    if (!selectedSale) {
      toast.error("Please select a sale first");
      return;
    }

    if (refundForm.selectedItems.length === 0) {
      toast.error("Please select items to refund");
      return;
    }

    try {
      const selectedItemsData = saleItems.filter((item: any) =>
        refundForm.selectedItems.includes(item.productId)
      );

      const refundAmount = calculateRefundAmount();

      await createRefund({
        saleId: selectedSale._id,
        items: selectedItemsData.map((item: any) => ({
          productId: item.productId as Id<"products">,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          size: item.size,
          reason: "defective",
          condition: "damaged",
          notes: refundForm.refundNotes,
        })),
        subtotal: selectedItemsData.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
        tax: Math.round((selectedSale.tax || 0) * (refundAmount / (selectedSale.total || 1))),
        discount: Math.round((selectedSale.discount || 0) * (refundAmount / (selectedSale.total || 1))),
        refundAmount,
        refundMethod: refundForm.refundMethod,
        refundReason: refundForm.refundReason,
        refundNotes: refundForm.refundNotes,
        restockRequired: refundForm.restockRequired,
      });

      toast.success("Refund request created successfully!");
      setActiveTab("list");
      setSelectedSale(null);
      setRefundForm({
        selectedItems: [],
        refundMethod: "cash",
        refundReason: "quality_issue",
        refundNotes: "",
        restockRequired: true,
      });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // ✅ Approve refund
  const handleApproveRefund = async (refundId: Id<"refunds">) => {
    try {
      await approveRefund({
        refundId,
        approvalNotes: approvalNotes || undefined,
      });
      toast.success("Refund approved successfully!");
      setApprovalNotes("");
      setSelectedRefund(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // ✅ Reject refund
  const handleRejectRefund = async (refundId: Id<"refunds">) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide rejection reason");
      return;
    }

    try {
      await rejectRefund({
        refundId,
        rejectionReason,
      });
      toast.success("Refund rejected successfully!");
      setRejectionReason("");
      setSelectedRefund(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // ✅ Process refund
  const handleProcessRefund = async (refundId: Id<"refunds">) => {
    try {
      await processRefund({
        refundId,
      });
      toast.success("Refund processed successfully!");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  // ✅ Complete refund
  const handleCompleteRefund = async (refundId: Id<"refunds">) => {
    if (!returnCondition) {
      toast.error("Please select return condition");
      return;
    }

    try {
      await completeRefund({
        refundId,
        returnCondition,
        inspectionNotes: inspectionNotes || undefined,
      });
      toast.success("Refund completed successfully!");
      setReturnCondition("");
      setInspectionNotes("");
      setSelectedRefund(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-bold text-white">Refund Management</h2>
        {pendingRefunds.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="bg-red-500 rounded-full px-3 py-1 text-white text-sm font-semibold">
              {pendingRefunds.length} Pending Approvals
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 font-medium ${
            activeTab === "list"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-400 hover:text-white"
          }`}
        >
          📋 Refund List
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 font-medium ${
            activeTab === "create"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ➕ Create Refund
        </button>
      </div>

      {/* LIST TAB */}
      {activeTab === "list" && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-300">Refund #</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-300">Sale #</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-300">Customer</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-300">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No refunds found
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr key={refund._id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-white">{refund.refundNumber}</td>
                      <td className="px-6 py-4 text-gray-300">{refund.saleNumber}</td>
                      <td className="px-6 py-4 text-gray-300">{refund.customerName || "N/A"}</td>
                      <td className="px-6 py-4 font-semibold text-white">
                        ৳{refund.refundAmount.toLocaleString("en-BD")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            refund.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : refund.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedRefund(refund)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === "create" && (
        <div className="space-y-6">
          {!selectedSale ? (
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Sale to Refund</h3>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by sale number or customer name..."
                  value={searchSaleNumber}
                  onChange={(e) => setSearchSaleNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Sales List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSales.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No sales found</p>
                ) : (
                  filteredSales.map((sale) => (
                    <button
                      key={sale._id}
                      onClick={() => setSelectedSale(sale)}
                      className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 hover:border-red-600 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">{sale.saleNumber}</p>
                          <p className="text-sm text-gray-400">
                            {sale.customerName || "Walk-in Customer"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sale.items.length} items • {sale.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            ৳{sale.total.toLocaleString("en-BD")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(sale._creationTime).toLocaleDateString("en-BD")}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Sale: {selectedSale.saleNumber}</h3>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-sm transition"
                >
                  Change Sale
                </button>
              </div>

              {/* Sale Summary */}
              <div className="bg-gray-800 rounded p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Customer</p>
                    <p className="font-semibold text-white">{selectedSale.customerName || "Walk-in"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="font-semibold text-white">
                      ৳{selectedSale.total.toLocaleString("en-BD")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Selection */}
              <div>
                <h4 className="font-semibold text-white mb-3">Select Items to Refund</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {saleItems.map((item: any) => (
                    <label
                      key={item.productId}
                      className="flex items-center p-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={refundForm.selectedItems.includes(item.productId)}
                        onChange={() => toggleItemSelection(item.productId)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-white">{item.productName}</p>
                        <p className="text-sm text-gray-400">
                          Qty: {item.quantity} • ৳{item.unitPrice.toLocaleString("en-BD")} •
                          {item.size ? ` Size: ${item.size}` : ""}
                        </p>
                      </div>
                      <p className="font-semibold text-white">
                        ৳{item.totalPrice.toLocaleString("en-BD")}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Refund Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refund Amount
                  </label>
                  <input
                    type="number"
                    value={calculateRefundAmount()}
                    disabled
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refund Method
                  </label>
                  <select
                    value={refundForm.refundMethod}
                    onChange={(e) =>
                      setRefundForm({ ...refundForm, refundMethod: e.target.value as any })
                    }
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_banking">Mobile Banking</option>
                    <option value="card">Card</option>
                    <option value="credit_account">Credit Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refund Reason
                  </label>
                  <select
                    value={refundForm.refundReason}
                    onChange={(e) =>
                      setRefundForm({ ...refundForm, refundReason: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none"
                  >
                    <option value="quality_issue">Quality Issue</option>
                    <option value="change_of_mind">Change of Mind</option>
                    <option value="wrong_product">Wrong Product</option>
                    <option value="expired">Expired</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={refundForm.refundNotes}
                    onChange={(e) =>
                      setRefundForm({ ...refundForm, refundNotes: e.target.value })
                    }
                    placeholder="Any additional notes about this refund..."
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none"
                    rows={3}
                  />
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={refundForm.restockRequired}
                    onChange={(e) =>
                      setRefundForm({ ...refundForm, restockRequired: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-300">Restock required</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreateRefund}
                  disabled={refundForm.selectedItems.length === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                >
                  Create Refund Request
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REFUND DETAILS MODAL */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900">
              <h3 className="text-lg font-semibold text-white">
                Refund: {selectedRefund.refundNumber}
              </h3>
              <button
                onClick={() => setSelectedRefund(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Sale Number</p>
                  <p className="text-white font-semibold">{selectedRefund.saleNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Refund Amount</p>
                  <p className="text-white font-semibold">
                    ৳{selectedRefund.refundAmount.toLocaleString("en-BD")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-white font-semibold">{selectedRefund.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Refund Method</p>
                  <p className="text-white font-semibold">{selectedRefund.refundMethod}</p>
                </div>
              </div>

              {/* Action Buttons based on Status */}
              {selectedRefund.approvalStatus === "pending_approval" && (
                <div className="space-y-2 pt-4 border-t border-gray-700">
                  <input
                    type="text"
                    placeholder="Approval notes (optional)"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRefund(selectedRefund._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition"
                    >
                      Approve
                    </button>
                    <input
                      type="text"
                      placeholder="Rejection reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => handleRejectRefund(selectedRefund._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedRefund.approvalStatus === "approved" && selectedRefund.status === "pending" && (
                <button
                  onClick={() => handleProcessRefund(selectedRefund._id)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
                >
                  Process Refund
                </button>
              )}

              {selectedRefund.status === "processed" && (
                <div className="space-y-2 pt-4 border-t border-gray-700">
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none text-sm"
                  >
                    <option value="">Select Return Condition</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                  <textarea
                    placeholder="Inspection notes (optional)"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-red-600 focus:outline-none text-sm"
                    rows={2}
                  />
                  <button
                    onClick={() => handleCompleteRefund(selectedRefund._id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition"
                  >
                    Complete Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
