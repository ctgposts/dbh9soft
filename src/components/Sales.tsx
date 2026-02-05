import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { InvoiceModal } from "./InvoiceModal";
import RefundManagement from "./RefundManagement";

export default function Sales() {
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showRefundManagement, setShowRefundManagement] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");

  const sales = useQuery(api.sales.list, {
    limit: 100,
  });

  if (!sales) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const handleViewInvoice = (sale: any) => {
    setSelectedSale(sale);
    setShowInvoice(true);
  };

  const paymentMethods = [
    { id: "cash", name: "Cash" },
    { id: "bkash", name: "bKash" },
    { id: "nagad", name: "Nagad" },
    { id: "rocket", name: "Rocket" },
    { id: "upay", name: "Upay" },
    { id: "card", name: "Card" },
    { id: "cod", name: "Cash on Delivery" },
  ];

  if (showRefundManagement) {
    return (
      <div>
        <button
          onClick={() => setShowRefundManagement(false)}
          className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition"
        >
          ← Back to Sales
        </button>
        <RefundManagement />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Sales History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRefundManagement(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition"
          >
            Manage Refunds
          </button>
          <div className="text-sm text-gray-500">
            Total Sales: {sales.length}
          </div>
        </div>
      </div>

      {/* Filters - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card View for Sales */}
      <div className="block sm:hidden space-y-3">
        {sales.map((sale) => (
          <div key={sale._id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{sale.saleNumber}</h3>
                <p className="text-xs text-gray-600">{sale.customerName || "Walk-in Customer"}</p>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                sale.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : sale.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {sale.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium">{sale.items.length} items</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-red-600">৳{sale.total.toLocaleString('en-BD')}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment</p>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                  {sale.paymentMethod}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{new Date(sale._creationTime).toLocaleDateString('en-BD')}</p>
              </div>
            </div>
            
            <button
              onClick={() => handleViewInvoice(sale)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View Invoice
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.saleNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.customerName || "Walk-in Customer"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    ৳{sale.total.toLocaleString('en-BD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale._creationTime).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : sale.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewInvoice(sale)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-black to-gray-800 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-xl sm:text-2xl font-bold">
            ৳{sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString('en-BD')}
          </p>
        </div>
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Average Sale</h3>
          <p className="text-xl sm:text-2xl font-bold">
            ৳{sales.length > 0 ? (sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length).toLocaleString('en-BD') : '0'}
          </p>
        </div>
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Items Sold</h3>
          <p className="text-xl sm:text-2xl font-bold">
            {sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
          </p>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && selectedSale && (
        <InvoiceModal
          sale={selectedSale}
          onClose={() => {
            setShowInvoice(false);
            setSelectedSale(null);
          }}
        />
      )}
    </div>
  );
}
