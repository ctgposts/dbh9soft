import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

function OnlineStore() {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const onlineProducts = useQuery(api.onlineStore.listOnlineProducts, {});
  const onlineOrders = useQuery(api.onlineStore.listOnlineOrders, {
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const updateOrderStatus = useMutation(api.onlineStore.updateOnlineOrderStatus);
  const fulfillOrder = useMutation(api.onlineStore.fulfillOnlineOrder);

  const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

  const handleStatusUpdate = async (orderId: Id<"onlineOrders">, newStatus: string) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus });
      toast.success("Order status updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleFulfillOrder = async (orderId: Id<"onlineOrders">) => {
    if (confirm("Fulfill this online order?")) {
      try {
        await fulfillOrder({ orderId });
        toast.success("Order fulfilled successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to fulfill order");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "badge-warning";
      case "confirmed": return "badge-info";
      case "processing": return "badge-purple";
      case "shipped": return "badge-success";
      case "delivered": return "badge-success";
      case "cancelled": return "badge-danger";
      default: return "badge-info";
    }
  };

  // Show loading state
  if (!onlineProducts || !onlineOrders) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">🌐 Online Store</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "products"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📦 Products ({onlineProducts?.filter(p => p.isOnline).length || 0})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "orders"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🛒 Orders ({onlineOrders?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "products" && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Online products management - showing products available on the online store
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineProducts?.filter(p => p.isOnline).map((item) => (
                  <div key={item._id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.product?.name}</h3>
                        <p className="text-sm text-gray-600">{item.product?.brand}</p>
                      </div>
                      {item.featured && (
                        <span className="badge badge-purple">⭐ Featured</span>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">
                          ৳{(item.onlinePrice || item.product?.sellingPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      {item.onlineDiscount && item.onlineDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>{item.onlineDiscount}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className="font-medium">{item.product?.currentStock || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field max-w-xs"
                >
                  <option value="all">All Orders</option>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Orders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {onlineOrders?.map((order) => (
                  <div key={order._id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        <p className="text-sm text-gray-600">{order.customerPhone}</p>
                      </div>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-medium text-sm">Items:</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.productName} x{item.quantity}</span>
                          <span>৳{item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

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
                        <span>Shipping:</span>
                        <span>৳{order.shippingCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>৳{order.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>৳{order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4 text-sm">
                      <p className="font-medium">Shipping Address:</p>
                      <p className="text-gray-600">
                        {order.shippingAddress.name}<br />
                        {order.shippingAddress.address}<br />
                        {order.shippingAddress.city} {order.shippingAddress.postalCode}<br />
                        {order.shippingAddress.phone}
                      </p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Update Status:
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="input-field"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {order.status === "confirmed" && order.paymentStatus === "paid" && (
                      <button
                        onClick={() => handleFulfillOrder(order._id)}
                        className="w-full btn-success"
                      >
                        ✅ Fulfill Order
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {onlineOrders?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No online orders found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnlineStore;
