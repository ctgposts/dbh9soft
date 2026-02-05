import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { InvoiceModal } from "./InvoiceModal";

interface CartItem {
  productId: Id<"products">;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string;
  availableSizes: string[];
}

interface Customer {
  _id: Id<"customers">;
  name: string;
  phone?: string;
  email?: string;
}

interface Product {
  _id: Id<"products">;
  name: string;
  brand: string;
  sellingPrice: number;
  currentStock: number;
  sizes: string[];
  color: string;
  fabric: string;
  barcode: string;
  isActive: boolean;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobilePaymentDetails, setMobilePaymentDetails] = useState({
    phoneNumber: "",
    transactionId: "",
    reference: ""
  });
  const [deliveryInfo, setDeliveryInfo] = useState({
    type: "pickup",
    address: "",
    phone: "",
    charges: 0
  });

  const products = useQuery(api.products.list, {}) || [];
  const customers = useQuery(api.customers.list, {}) || [];
  const createSale = useMutation(api.sales.create);

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.isActive && 
    product.currentStock > 0 &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.barcode.includes(searchTerm))
  );

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.phone && customer.phone.includes(customerSearch))
  );

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const dueAmount = Math.max(0, total - paidAmount);

  // Auto-set paid amount when total changes
  useEffect(() => {
    if (paymentMethod === "cash") {
      setPaidAmount(total);
    }
  }, [total, paymentMethod]);

  const addToCart = (product: Product, selectedSize?: string) => {
    if (product.currentStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const existingItemIndex = cart.findIndex(
      item => item.productId === product._id && item.size === selectedSize
    );

    if (existingItemIndex >= 0) {
      const existingItem = cart[existingItemIndex];
      if (existingItem.quantity >= product.currentStock) {
        toast.error("Cannot add more items than available stock");
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + 1,
        totalPrice: (existingItem.quantity + 1) * existingItem.unitPrice
      };
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice,
        size: selectedSize,
        availableSizes: product.sizes
      };
      setCart([...cart, newItem]);
    }

    toast.success(`${product.name} added to cart`);
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    const product = products.find(p => p._id === item.productId);
    
    if (product && newQuantity > product.currentStock) {
      toast.error("Cannot exceed available stock");
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQuantity,
      totalPrice: newQuantity * item.unitPrice
    };
    setCart(updatedCart);
  };

  const updateCartItemSize = (index: number, newSize: string) => {
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...updatedCart[index],
      size: newSize
    };
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setPaidAmount(0);
    setSearchTerm("");
    toast.success("Cart cleared");
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (paidAmount < 0) {
      toast.error("Paid amount cannot be negative");
      return;
    }

    setIsProcessing(true);

    try {
      const saleData = {
        customerId: selectedCustomer?._id,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          size: item.size
        })),
        subtotal,
        discount: discountAmount,
        total,
        paidAmount,
        dueAmount,
        paymentMethod,
        paymentDetails: ["bkash", "nagad", "rocket"].includes(paymentMethod) ? {
          phoneNumber: mobilePaymentDetails.phoneNumber,
          status: "pending"
        } : undefined,
      };

      const saleId = await createSale(saleData);
      
      // Get the created sale for invoice
      const sale = {
        _id: saleId,
        saleNumber: `SALE-${Date.now()}`,
        ...saleData,
        _creationTime: Date.now()
      };

      setLastSale(sale);
      setShowInvoice(true);
      clearCart();
      
      toast.success("Sale completed successfully!");
    } catch (error) {
      console.error("Sale error:", error);
      toast.error("Failed to process sale. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-black">🏷️ Point of Sale</h1>
          <p className="text-sm text-gray-600 mt-1">Process sales transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="px-6 py-3 text-sm border border-gray-200 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Mobile: Cart at Top */}
      <div className="block lg:hidden order-first space-y-4">
        {cart.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              🛒 Cart ({cart.length} items)
            </h3>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={`${item.productId}-${item.size}`} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {item.productName}
                      </h4>
                      {item.size && (
                        <p className="text-xs text-gray-500">Size: {item.size}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-600 hover:text-red-800 text-xs font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const updatedCart = [...cart];
                          updatedCart[index].quantity = Math.max(1, updatedCart[index].quantity - 1);
                          updatedCart[index].totalPrice = updatedCart[index].quantity * updatedCart[index].unitPrice;
                          setCart(updatedCart);
                        }}
                        className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const updatedCart = [...cart];
                          updatedCart[index].quantity += 1;
                          updatedCart[index].totalPrice = updatedCart[index].quantity * updatedCart[index].unitPrice;
                          setCart(updatedCart);
                        }}
                        className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold text-purple-600">
                      ৳{item.totalPrice.toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: Checkout at Top */}
        {cart.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Checkout</h3>
            
            {/* Discount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="cash">Cash</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {/* Mobile Payment Details */}
            {["bkash", "nagad", "rocket"].includes(paymentMethod) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  📱 Mobile Payment Details
                </h4>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={mobilePaymentDetails.phoneNumber}
                  onChange={(e) => setMobilePaymentDetails({
                    ...mobilePaymentDetails,
                    phoneNumber: e.target.value
                  })}
                  className="w-full px-3 py-2 text-sm border rounded"
                />
              </div>
            )}

            {/* Paid Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount (৳)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>৳{subtotal.toLocaleString('en-BD')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%):</span>
                  <span>-৳{discountAmount.toLocaleString('en-BD')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>৳{total.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paid:</span>
                <span>৳{paidAmount.toLocaleString('en-BD')}</span>
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>Due:</span>
                  <span>৳{dueAmount.toLocaleString('en-BD')}</span>
                </div>
              )}
              {paidAmount > total && (
                <div className="flex justify-between text-sm text-blue-600 font-medium">
                  <span>Change:</span>
                  <span>৳{(paidAmount - total).toLocaleString('en-BD')}</span>
                </div>
              )}
            </div>

            {/* Process Sale Button */}
            <button
              onClick={processSale}
              disabled={isProcessing || cart.length === 0}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                "✅ Complete Sale"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🔍</span>
              <h3 className="text-lg font-bold text-gray-900">Search Products</h3>
            </div>
            <input
              type="text"
              placeholder="Search by name, brand, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Products Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Available Products</h3>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">📦</span>
                <p className="text-gray-500 mt-2">
                  {searchTerm ? "No products found matching your search" : "No products available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (product.sizes.length > 1) {
                        // Show size selection for products with multiple sizes
                        const size = prompt(`Select size for ${product.name}:\n${product.sizes.join(", ")}`);
                        if (size && product.sizes.includes(size)) {
                          addToCart(product, size);
                        }
                      } else {
                        addToCart(product, product.sizes[0]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Stock: {product.currentStock}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <div>{product.brand} • {product.color}</div>
                      <div>{product.fabric}</div>
                      <div>Sizes: {product.sizes.join(", ")}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-600">
                        ৳{product.sellingPrice.toLocaleString('en-BD')}
                      </span>
                      <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout Section */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Select
              </button>
            </div>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                  {selectedCustomer.phone && (
                    <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-center py-3 text-gray-500 text-sm">
                Walk-in Customer
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              🛒 Cart ({cart.length} items)
            </h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl">🛒</span>
                <p className="text-gray-500 mt-3 text-sm font-medium">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${item.size}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {item.productName}
                        </h4>
                        {item.size && (
                          <div className="text-xs text-gray-600">Size: {item.size}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ৳{item.totalPrice.toLocaleString('en-BD')}
                        </div>
                        <div className="text-xs text-gray-600">
                          ৳{item.unitPrice.toLocaleString('en-BD')} each
                        </div>
                      </div>
                    </div>

                    {/* Size selector for items with multiple sizes */}
                    {item.availableSizes.length > 1 && (
                      <div className="mt-2">
                        <select
                          value={item.size || ""}
                          onChange={(e) => updateCartItemSize(index, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="">Select Size</option>
                          {item.availableSizes.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout */}
          {cart.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Checkout</h3>
              
              {/* Discount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Mobile Payment Details */}
              {["bkash", "nagad", "rocket"].includes(paymentMethod) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    📱 Mobile Payment Details
                  </h4>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={mobilePaymentDetails.phoneNumber}
                    onChange={(e) => setMobilePaymentDetails({
                      ...mobilePaymentDetails,
                      phoneNumber: e.target.value
                    })}
                    className="w-full px-3 py-2 text-sm border rounded"
                  />
                </div>
              )}

              {/* Paid Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>৳{subtotal.toLocaleString('en-BD')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount}%):</span>
                    <span>-৳{discountAmount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>৳{total.toLocaleString('en-BD')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Paid:</span>
                  <span>৳{paidAmount.toLocaleString('en-BD')}</span>
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 font-medium">
                    <span>Due:</span>
                    <span>৳{dueAmount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                {paidAmount > total && (
                  <div className="flex justify-between text-sm text-blue-600 font-medium">
                    <span>Change:</span>
                    <span>৳{(paidAmount - total).toLocaleString('en-BD')}</span>
                  </div>
                )}
              </div>

              {/* Process Sale Button */}
              <button
                onClick={processSale}
                disabled={isProcessing || cart.length === 0}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "Complete Sale"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Customer</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-3xl">👥</span>
                  <p className="text-gray-500 mt-2 text-sm">No customers found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer._id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                        setCustomerSearch("");
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      )}
                      {customer.email && (
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && lastSale && (
        <InvoiceModal
          sale={lastSale}
          onClose={() => {
            setShowInvoice(false);
            setLastSale(null);
          }}
        />
      )}
      </div>
    </div>
  );
}
