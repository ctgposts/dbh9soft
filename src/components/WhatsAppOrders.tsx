import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export default function WhatsAppOrders() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Id<"whatsappOrders"> | null>(null);
  const [showCreateReturn, setShowCreateReturn] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<Id<"whatsappOrders"> | null>(null);

  const orders = useQuery(api.whatsappOrders.list, {
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const branches = useQuery(api.branches.list, {});
  const employees = useQuery(api.employees.list, {});

  const updateStatus = useMutation(api.whatsappOrders.updateStatus);
  const convertToSale = useMutation(api.whatsappOrders.convertToSale);
  const sendNotification = useMutation(api.notifications.sendNotification);
  const createReturn = useMutation(api.returns.createReturn);

  const statuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];

  const handleStatusUpdate = async (orderId: Id<"whatsappOrders">, newStatus: string) => {
    try {
      const order = orders?.find(o => o._id === orderId);
      if (!order) return;

      await updateStatus({ id: orderId, status: newStatus });
      
      // Send notification
      const messages: Record<string, string> = {
        confirmed: `Your WhatsApp order ${order.orderNumber} has been confirmed!`,
        preparing: `Your order is now being prepared.`,
        ready: `Your order is ready for pickup/delivery!`,
        delivered: `Your order has been delivered. Thank you for your purchase!`,
        cancelled: `Your order has been cancelled. Contact us for refund details.`,
      };

      if (messages[newStatus] && order.customerPhone) {
        await sendNotification({
          whatsappOrderId: orderId,
          customerPhone: order.customerPhone,
          notificationType: "whatsapp",
          message: messages[newStatus],
        });
      }

      toast.success("Order status updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleConvertToSale = async (orderId: Id<"whatsappOrders">) => {
    if (confirm("Convert this WhatsApp order to a sale?")) {
      try {
        const order = orders?.find(o => o._id === orderId);
        if (!order) return;

        await convertToSale({
          orderId,
          paymentMethod: "cash",
          paidAmount: order.total,
        });

        // Send confirmation
        await sendNotification({
          whatsappOrderId: orderId,
          customerPhone: order.customerPhone,
          notificationType: "whatsapp",
          message: `Your order ${order.orderNumber} has been confirmed as a sale!`,
        });

        toast.success("Order converted to sale successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to convert order");
      }
    }
  };

  const handleInitiateReturn = (orderId: Id<"whatsappOrders">) => {
    setReturnOrderId(orderId);
    setShowCreateReturn(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "badge-warning";
      case "confirmed": return "badge-info";
      case "preparing": return "badge-purple";
      case "ready": return "badge-success";
      case "delivered": return "badge-success";
      case "cancelled": return "badge-danger";
      default: return "badge-info";
    }
  };

  const getStatusProgress = (status: string) => {
    const progress: Record<string, number> = {
      pending: 20,
      confirmed: 40,
      preparing: 60,
      ready: 80,
      delivered: 100,
      cancelled: 0,
    };
    return progress[status] || 0;
  };

  // Show loading state
  if (!orders || !branches || !employees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">লোডিং হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">📱 WhatsApp Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Manage WhatsApp customer orders • {orders?.length || 0} total</p>
        </div>
      </div>

      {/* Filter & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-5 border border-yellow-100/50">
          <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pending</div>
          <div className="text-2xl font-bold text-yellow-700 mt-2">{orders?.filter(o => o.status === "pending").length || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-100/50">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Confirmed</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{orders?.filter(o => o.status === "confirmed").length || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-100/50">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Ready</div>
          <div className="text-2xl font-bold text-green-700 mt-2">{orders?.filter(o => o.status === "ready").length || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-100/50">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Total Revenue</div>
          <div className="text-2xl font-bold text-purple-700 mt-2">৳{(orders?.reduce((sum, o) => sum + o.total, 0) || 0).toFixed(0)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
        <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Filter by Status
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="all">All Orders</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {orders?.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-6 space-y-4 hover:shadow-lg transition">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">{order.customerName}</p>
                <p className="text-sm text-gray-600">📱 {order.customerPhone}</p>
              </div>
              <span className={`badge ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="border-t pt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${getStatusProgress(order.status)}%` }}
                ></div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Items:</h4>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                  <span>{item.productName} x{item.quantity}</span>
                  <span className="font-medium">৳{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="border-t pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>৳{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-৳{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>৳{order.deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">৳{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="border-t pt-4 text-sm bg-blue-50 p-3 rounded">
                <p className="font-medium">📍 Delivery Address:</p>
                <p className="text-gray-700">{order.deliveryAddress}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="border-t pt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Update Status:
              </label>
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                className="input-field"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-4 grid grid-cols-2 gap-2">
              {order.status === "ready" && (
                <button
                  onClick={() => handleConvertToSale(order._id)}
                  className="w-full btn-success text-sm"
                >
                  ✅ Convert to Sale
                </button>
              )}
              {order.status === "delivered" && (
                <button
                  onClick={() => handleInitiateReturn(order._id)}
                  className="w-full btn-warning text-sm"
                >
                  ↩️ Return Request
                </button>
              )}
              <button
                onClick={() => window.open(`https://wa.me/${order.customerWhatsApp}`, "_blank")}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm font-medium"
              >
                💬 Chat on WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
      {orders?.length === 0 && (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60">
          <p className="text-gray-500 font-medium">No WhatsApp orders found</p>
        </div>
      )}
      </div>
    </div>
  );
}
