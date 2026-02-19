import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Outstanding {
  _id: Id<"outstandingAmounts">;
  customerId: Id<"customers">;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  branchId: Id<"branches">;
  branchName: string;
  saleIds: Id<"sales">[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  outstandingDays: number;
  status: string;
  dueDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  _creationTime: number;
}

interface Payment {
  _id: Id<"outstandingPayments">;
  outstandingId: Id<"outstandingAmounts">;
  customerId: Id<"customers">;
  customerName: string;
  saleId?: Id<"sales">;
  saleNumber?: string;
  amount: number;
  paymentMethod: string;
  paymentDetails?: any;
  paymentDate: number;
  notes?: string;
  branchId: Id<"branches">;
  branchName: string;
  recordedBy: string;
  recordedByName: string;
}

interface Followup {
  _id: Id<"collectionFollowups">;
  outstandingId: Id<"outstandingAmounts">;
  customerId: Id<"customers">;
  customerName: string;
  followupType: string;
  description: string;
  promiseAmount?: number;
  promiseDate?: number;
  outcome: string;
  notes?: string;
  nextFollowupDate?: number;
  createdAt: number;
  createdBy: string;
  createdByName: string;
}

export default function OutstandingAmount() {
  const [activeTab, setActiveTab] = useState("list"); // list, add, detail, reports
  const [selectedOutstanding, setSelectedOutstanding] = useState<Outstanding | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("amount");
  const [branchFilter, setBranchFilter] = useState("");

  // Add Outstanding Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmittingOutstanding, setIsSubmittingOutstanding] = useState(false);
  const [newOutstanding, setNewOutstanding] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    branchId: "",
    branchName: "",
    totalAmount: 0,
    dueDate: "",
    notes: "",
  });

  // Payment Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: "cash",
    transactionId: "",
    chequeNumber: "",
    notes: "",
  });

  // Followup Form
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);
  const [followupData, setFollowupData] = useState({
    followupType: "call",
    description: "",
    promiseAmount: 0,
    promiseDate: "",
    outcome: "pending",
    notes: "",
    nextFollowupDate: "",
  });

  // Queries
  const outstandingList = useQuery(api.outstanding.list, {
    status: filterStatus === "all" ? undefined : filterStatus,
    searchTerm: searchTerm || undefined,
    sortBy: sortBy,
  });

  const summary = useQuery(api.outstanding.getOutstandingSummary, {});
  const agingData = useQuery(api.outstanding.getAging, {});
  
  // Get customers and branches for dropdowns
  const customers = useQuery(api.customers.list, { searchTerm: undefined });
  const branches = useQuery(api.branches.list, {});

  const paymentHistory =
    selectedOutstanding && activeTab === "detail"
      ? useQuery(api.outstanding.getPaymentHistory, {
          outstandingId: selectedOutstanding._id,
        })
      : null;

  const followupHistory =
    selectedOutstanding && activeTab === "detail"
      ? useQuery(api.outstanding.getFollowupHistory, {
          outstandingId: selectedOutstanding._id,
        })
      : null;

  // Mutations
  const createOutstanding = useMutation(api.outstanding.create);
  const addPayment = useMutation(api.outstanding.addPayment);
  const addFollowup = useMutation(api.outstanding.addFollowup);
  const updateStatus = useMutation(api.outstanding.updateStatus);
  const updateNotes = useMutation(api.outstanding.updateNotes);
  const deleteOutstanding = useMutation(api.outstanding.deleteOutstanding);
  const updateAging = useMutation(api.outstanding.updateAging);

  // Handle Add Outstanding
  const handleAddOutstanding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOutstanding.customerId.trim()) {
      toast.error("Please select a customer");
      return;
    }

    if (!newOutstanding.branchId.trim()) {
      toast.error("Please select a branch");
      return;
    }

    if (newOutstanding.totalAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsSubmittingOutstanding(true);
    try {
      const dueDate = newOutstanding.dueDate
        ? new Date(newOutstanding.dueDate).getTime()
        : undefined;

      await createOutstanding({
        customerId: newOutstanding.customerId as Id<"customers">,
        customerName: newOutstanding.customerName,
        customerPhone: newOutstanding.customerPhone,
        customerEmail: newOutstanding.customerEmail,
        branchId: newOutstanding.branchId as Id<"branches">,
        branchName: newOutstanding.branchName,
        saleIds: [] as Id<"sales">[],
        totalAmount: newOutstanding.totalAmount,
        dueDate: dueDate,
        notes: newOutstanding.notes,
      });

      toast.success("Outstanding amount added successfully");
      setShowAddForm(false);
      setNewOutstanding({
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        branchId: "",
        branchName: "",
        totalAmount: 0,
        dueDate: "",
        notes: "",
      });
      setActiveTab("list");
    } catch (error) {
      toast.error("Failed to add outstanding amount");
      console.error(error);
    } finally {
      setIsSubmittingOutstanding(false);
    }
  };

  // Handle Add Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOutstanding) {
      toast.error("No outstanding record selected");
      return;
    }

    if (paymentData.amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    if (paymentData.amount > selectedOutstanding.remainingAmount) {
      toast.error(
        `Payment amount cannot exceed remaining balance (${selectedOutstanding.remainingAmount.toLocaleString()})`
      );
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const paymentDetails: any = {
        paymentMethod: paymentData.paymentMethod,
      };

      if (paymentData.transactionId) {
        paymentDetails.transactionId = paymentData.transactionId;
      }
      if (paymentData.chequeNumber) {
        paymentDetails.chequeNumber = paymentData.chequeNumber;
      }

      await addPayment({
        outstandingId: selectedOutstanding._id,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: paymentDetails,
        notes: paymentData.notes,
      });

      await updateAging({
        outstandingId: selectedOutstanding._id,
      });

      toast.success("Payment recorded successfully");
      setShowPaymentForm(false);
      setPaymentData({
        amount: 0,
        paymentMethod: "cash",
        transactionId: "",
        chequeNumber: "",
        notes: "",
      });

      // Refresh the outstanding list to get updated data
      setTimeout(() => {
        if (outstandingList) {
          const updated = outstandingList.find(
            (o) => o._id === selectedOutstanding._id
          );
          if (updated) {
            setSelectedOutstanding(updated);
          }
        }
      }, 500);
    } catch (error) {
      toast.error("Failed to record payment");
      console.error(error);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle Add Followup
  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOutstanding) {
      toast.error("No outstanding record selected");
      return;
    }

    if (!followupData.description.trim()) {
      toast.error("Followup description is required");
      return;
    }

    setIsSubmittingFollowup(true);
    try {
      const promiseDate = followupData.promiseDate
        ? new Date(followupData.promiseDate).getTime()
        : undefined;

      const nextFollowupDate = followupData.nextFollowupDate
        ? new Date(followupData.nextFollowupDate).getTime()
        : undefined;

      await addFollowup({
        outstandingId: selectedOutstanding._id,
        followupType: followupData.followupType,
        description: followupData.description,
        promiseAmount: followupData.promiseAmount || undefined,
        promiseDate: promiseDate,
        outcome: followupData.outcome,
        notes: followupData.notes,
        nextFollowupDate: nextFollowupDate,
      });

      toast.success("Followup added successfully");
      setShowFollowupForm(false);
      setFollowupData({
        followupType: "call",
        description: "",
        promiseAmount: 0,
        promiseDate: "",
        outcome: "pending",
        notes: "",
        nextFollowupDate: "",
      });
    } catch (error) {
      toast.error("Failed to add followup");
      console.error(error);
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  // Handle Delete Outstanding
  const handleDelete = async (id: Id<"outstandingAmounts">) => {
    if (!confirm("Are you sure you want to delete this outstanding record?")) {
      return;
    }

    try {
      await deleteOutstanding({ id });
      toast.success("Outstanding record deleted");
      setActiveTab("list");
      setSelectedOutstanding(null);
    } catch (error) {
      toast.error("Failed to delete outstanding record");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Outstanding Amount Management
              </h1>
              <p className="text-gray-600 mt-1">
                Track and collect customer receivables
              </p>
            </div>
            <button
              onClick={() => setActiveTab("list")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {["list", "add", "reports"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab || (activeTab === "detail" && tab === "list")
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "list" && "Outstanding List"}
                {tab === "add" && "Add Outstanding"}
                {tab === "reports" && "Reports & Aging"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* LIST TAB */}
        {(activeTab === "list" || (!selectedOutstanding && activeTab === "detail")) && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 text-sm font-medium">
                    Total Outstanding
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(summary.totalOutstanding)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.activeCustomers} active customers
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 text-sm font-medium">Overdue Amount</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {formatCurrency(summary.totalOverdue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.overdueCustomers} overdue customers
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 text-sm font-medium">Resolved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {formatCurrency(summary.totalResolved)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.byStatus.resolved} resolved
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-600 text-sm font-medium">Partial Payments</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {summary.byStatus.partial}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">customers with partial payments</p>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Customer name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="amount">Amount (High to Low)</option>
                    <option value="days">Days Outstanding</option>
                    <option value="name">Customer Name</option>
                    <option value="recent">Recently Updated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    &nbsp;
                  </label>
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setActiveTab("add");
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Outstanding
                  </button>
                </div>
              </div>
            </div>

            {/* Outstanding List Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid / Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outstandingList && outstandingList.length > 0 ? (
                      outstandingList.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50 cursor-pointer transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.customerName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.customerPhone}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.totalAmount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <p className="text-green-600">
                                Paid: {formatCurrency(item.paidAmount)}
                              </p>
                              <p className="text-red-600">
                                Remaining: {formatCurrency(item.remainingAmount)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {item.outstandingDays} days
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedOutstanding(item);
                                setActiveTab("detail");
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <p className="text-gray-500">No outstanding records found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DETAIL TAB */}
        {selectedOutstanding && activeTab === "detail" && (
          <div className="space-y-6">
            {/* Outstanding Header */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedOutstanding.customerName}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedOutstanding.customerPhone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOutstanding(null);
                    setActiveTab("list");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedOutstanding.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedOutstanding.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedOutstanding.remainingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                      selectedOutstanding.status
                    )}`}
                  >
                    {selectedOutstanding.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-gray-600 text-sm">Outstanding Days</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedOutstanding.outstandingDays} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Branch</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedOutstanding.branchName}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => setShowFollowupForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Followup
                </button>
                <button
                  onClick={() => handleDelete(selectedOutstanding._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Payment Form */}
            {showPaymentForm && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h3>
                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={paymentData.amount}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter payment amount"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max: {formatCurrency(selectedOutstanding.remainingAmount)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={paymentData.paymentMethod}
                        onChange={(e) =>
                          setPaymentData({
                            ...paymentData,
                            paymentMethod: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_banking">Mobile Banking</option>
                        <option value="cheque">Cheque</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {paymentData.paymentMethod === "mobile_banking" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          value={paymentData.transactionId}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              transactionId: e.target.value,
                            })
                          }
                          placeholder="Enter transaction ID"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {paymentData.paymentMethod === "cheque" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cheque Number
                        </label>
                        <input
                          type="text"
                          value={paymentData.chequeNumber}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              chequeNumber: e.target.value,
                            })
                          }
                          placeholder="Enter cheque number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={paymentData.notes}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, notes: e.target.value })
                      }
                      placeholder="Payment notes..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmittingPayment ? "Saving..." : "Save Payment"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      disabled={isSubmittingPayment}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Followup Form */}
            {showFollowupForm && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add Followup</h3>
                <form onSubmit={handleAddFollowup} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Followup Type
                      </label>
                      <select
                        value={followupData.followupType}
                        onChange={(e) =>
                          setFollowupData({
                            ...followupData,
                            followupType: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="call">Phone Call</option>
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="visit">Physical Visit</option>
                        <option value="note">Note</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Outcome
                      </label>
                      <select
                        value={followupData.outcome}
                        onChange={(e) =>
                          setFollowupData({
                            ...followupData,
                            outcome: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">Pending Response</option>
                        <option value="promised">Payment Promised</option>
                        <option value="partial_paid">Partial Payment</option>
                        <option value="no_response">No Response</option>
                        <option value="refused">Refused to Pay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promise Amount
                      </label>
                      <input
                        type="number"
                        value={followupData.promiseAmount}
                        onChange={(e) =>
                          setFollowupData({
                            ...followupData,
                            promiseAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Amount promised"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promise Date
                      </label>
                      <input
                        type="date"
                        value={followupData.promiseDate}
                        onChange={(e) =>
                          setFollowupData({
                            ...followupData,
                            promiseDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={followupData.description}
                      onChange={(e) =>
                        setFollowupData({
                          ...followupData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the followup conversation..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Followup Date
                    </label>
                    <input
                      type="date"
                      value={followupData.nextFollowupDate}
                      onChange={(e) =>
                        setFollowupData({
                          ...followupData,
                          nextFollowupDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={followupData.notes}
                      onChange={(e) =>
                        setFollowupData({
                          ...followupData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Any additional notes..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingFollowup}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmittingFollowup ? "Saving..." : "Save Followup"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFollowupForm(false)}
                      disabled={isSubmittingFollowup}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payment History */}
            {paymentHistory && paymentHistory.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Payment History
                </h3>
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)} -{" "}
                          {payment.paymentMethod.toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.paymentDate)} by {payment.recordedByName}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-600">Note: {payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Followup History */}
            {followupHistory && followupHistory.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Followup History
                </h3>
                <div className="space-y-3">
                  {followupHistory.map((followup) => (
                    <div
                      key={followup._id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {followup.followupType.toUpperCase()} -{" "}
                            {followup.outcome.toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(followup.createdAt)} by {followup.createdByName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {followup.description}
                      </p>
                      {followup.promiseAmount && (
                        <p className="text-sm font-medium text-blue-600">
                          Promised: {formatCurrency(followup.promiseAmount)}
                          {followup.promiseDate &&
                            ` on ${formatDate(followup.promiseDate)}`}
                        </p>
                      )}
                      {followup.notes && (
                        <p className="text-sm text-gray-600">Note: {followup.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD TAB */}
        {activeTab === "add" && (
          <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Add New Outstanding Amount
            </h2>
            <form onSubmit={handleAddOutstanding} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer *
                  </label>
                  <select
                    value={newOutstanding.customerId}
                    onChange={(e) => {
                      const selectedCustomer = customers?.find(
                        (c) => c._id === e.target.value
                      );
                      setNewOutstanding({
                        ...newOutstanding,
                        customerId: e.target.value,
                        customerName: selectedCustomer?.name || "",
                        customerPhone: selectedCustomer?.phone || "",
                        customerEmail: selectedCustomer?.email || "",
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {customers?.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Branch *
                  </label>
                  <select
                    value={newOutstanding.branchId}
                    onChange={(e) => {
                      const selectedBranch = branches?.find(
                        (b) => b._id === e.target.value
                      );
                      setNewOutstanding({
                        ...newOutstanding,
                        branchId: e.target.value,
                        branchName: selectedBranch?.name || "",
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a branch...</option>
                    {branches?.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name} {branch.code ? `(${branch.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name (Auto-filled)
                  </label>
                  <input
                    type="text"
                    value={newOutstanding.customerName}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Auto-filled)
                  </label>
                  <input
                    type="tel"
                    value={newOutstanding.customerPhone}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Auto-filled)
                  </label>
                  <input
                    type="email"
                    value={newOutstanding.customerEmail}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outstanding Amount *
                  </label>
                  <input
                    type="number"
                    value={newOutstanding.totalAmount}
                    onChange={(e) =>
                      setNewOutstanding({
                        ...newOutstanding,
                        totalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newOutstanding.dueDate}
                    onChange={(e) =>
                      setNewOutstanding({
                        ...newOutstanding,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newOutstanding.notes}
                  onChange={(e) =>
                    setNewOutstanding({
                      ...newOutstanding,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Add any notes about this outstanding amount..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingOutstanding}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmittingOutstanding ? "Saving..." : "Save Outstanding"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setActiveTab("list");
                  }}
                  disabled={isSubmittingOutstanding}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Aging Report */}
            {agingData && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Outstanding Aging Report
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          0-30 Days
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          30-60 Days
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          60-90 Days
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          90+ Days
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agingData.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium text-gray-900">
                              {item.customerName}
                            </p>
                            <p className="text-sm text-gray-500">{item.branchName}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <p className="font-medium text-green-600">
                              {formatCurrency(item.current)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <p className="font-medium text-yellow-600">
                              {formatCurrency(item.days30_60)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <p className="font-medium text-orange-600">
                              {formatCurrency(item.days60_90)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <p className="font-medium text-red-600">
                              {formatCurrency(item.days90plus)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(item.totalOutstanding)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {agingData.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No aging data available
                  </p>
                )}
              </div>
            )}

            {/* Summary Statistics */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Summary Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Status Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold">{summary.byStatus.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Partial</span>
                        <span className="font-semibold">{summary.byStatus.partial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overdue</span>
                        <span className="font-semibold text-red-600">
                          {summary.byStatus.overdue}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved</span>
                        <span className="font-semibold text-green-600">
                          {summary.byStatus.resolved}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Amount Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Outstanding</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(summary.totalOutstanding)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overdue Amount</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(summary.totalOverdue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved Amount</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(summary.totalResolved)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t">
                        <span className="text-gray-600">Active Customers</span>
                        <span className="font-bold">
                          {summary.activeCustomers}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
