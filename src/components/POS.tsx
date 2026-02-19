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
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("percentage");
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
  const [sizeSelectionModal, setSizeSelectionModal] = useState<{ product: Product | null; isOpen: boolean }>({
    product: null,
    isOpen: false
  });
  const [selectedSize, setSelectedSize] = useState<string>("");
  // ✅ FIX #17: Add coupon code support with expiry validation
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // ✅ FIX: Extract items array from paginated products query response
  const productsResponse = useQuery(api.products.list, { limit: 1000 });
  const products = productsResponse?.items || [];
  // ✅ FIX: Extract items array from paginated customers query response
  const customersResponse = useQuery(api.customers.list, {});
  const customers = customersResponse?.items || [];
  // ✅ FIX #17: Query all coupons for coupon code validation
  const coupons = useQuery(api.coupons.list, {}) || [];
  const createSale = useMutation(api.sales.create);
  const updateCustomer = useMutation(api.customers.update);

  // ✅ FIX #3: Stock validation for real-time availability
  const getAvailableStock = (productId: string): number => {
    const product = products.find(p => p._id === productId);
    if (!product) return 0;
    
    const inCart = cart.reduce((sum, item) => 
      item.productId === productId ? sum + item.quantity : sum, 0);
    
    return Math.max(0, product.currentStock - inCart);
  };

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

  // Auto-fill delivery info from customer's previous delivery details
  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c._id === selectedCustomer._id);
      if (customer && (customer.lastDeliveryAddress || customer.lastDeliveryPhone)) {
        setDeliveryInfo(prev => ({
          ...prev,
          address: customer.lastDeliveryAddress || prev.address,
          phone: customer.lastDeliveryPhone || prev.phone
        }));
      }
    } else {
      // Clear delivery info when customer is deselected
      setDeliveryInfo(prev => ({
        ...prev,
        address: "",
        phone: ""
      }));
    }
  }, [selectedCustomer, customers]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // ✅ FIX #17: Calculate discount from applied coupon or manual discount
  let calculatedDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      calculatedDiscountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountAmount && calculatedDiscountAmount > appliedCoupon.maxDiscountAmount) {
        calculatedDiscountAmount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      calculatedDiscountAmount = appliedCoupon.discountValue;
    }
  } else {
    calculatedDiscountAmount = discountType === "percentage" 
      ? (subtotal * discount) / 100 
      : discount;
  }
  
  const total = subtotal - calculatedDiscountAmount;
  const dueAmount = Math.max(0, total - paidAmount);

  // ✅ FIX #17: Validate and apply coupon code with expiry check
  const validateAndApplyCoupon = (code: string): string | null => {
    if (!code.trim()) {
      setAppliedCoupon(null);
      return null;
    }

    const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      return "Coupon code not found";
    }

    const now = Date.now();
    if (!coupon.isActive) {
      return "This coupon is not active";
    }
    
    // ✅ FIX #17: Check coupon expiry date
    if (coupon.validUntil < now) {
      return "This coupon has expired";
    }
    
    if (coupon.validFrom > now) {
      return "This coupon is not yet valid";
    }

    if (subtotal < (coupon.minOrderAmount || 0)) {
      return `Minimum order amount of ৳${coupon.minOrderAmount} required for this coupon`;
    }

    setAppliedCoupon(coupon);
    return null;
  };

  // Validation functions
  const validateCustomerInfo = (name: string, phone: string): string | null => {
    if (name && name.trim()) {
      // Only allow Bengali/English letters and spaces
      if (!/^[a-zA-Z\u0980-\u09FF\s\-\.]+$/.test(name)) {
        return "Customer name contains invalid characters. Only letters, spaces, hyphens and periods allowed.";
      }
      if (name.length > 100) {
        return "Customer name is too long (max 100 characters)";
      }
    }

    if (phone && phone.trim()) {
      // Bangladesh mobile format: 01XXXXXXXXX (11 digits)
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11 || !/^01\d{9}$/.test(cleanPhone)) {
        return "Invalid phone number. Use Bangladeshi format: 01XXXXXXXXX (11 digits)";
      }
    }

    return null;
  };

  // Real-time stock validation for cart items
  const validateCartStock = (): string | null => {
    for (const cartItem of cart) {
      const product = products.find(p => p._id === cartItem.productId);
      if (!product || product.currentStock < cartItem.quantity) {
        return `${cartItem.productName}: Only ${product?.currentStock || 0} items available (you have ${cartItem.quantity} in cart)`;
      }
    }
    return null;
  };

  // ✅ FIX #4: Comprehensive payment method validation
  const validatePaymentDetails = (method: string, details: any): string | null => {
    if (["bkash", "nagad", "rocket", "upay"].includes(method)) {
      if (!details.phoneNumber?.trim()) {
        return `Phone number is required for ${method.toUpperCase()}`;
      }
      
      // Bangladesh mobile format: 01XXXXXXXXX (11 digits)
      const cleanPhone = details.phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 11 || !/^01\d{9}$/.test(cleanPhone)) {
        return `Invalid phone number for ${method}. Use format: 01XXXXXXXXX (11 digits)`;
      }
      
      if (!details.transactionId?.trim()) {
        return `Transaction ID is required for ${method.toUpperCase()}`;
      }
      
      if (details.transactionId.length < 4) {
        return `Transaction ID must be at least 4 characters`;
      }
    }
    
    if (method === "card") {
      if (!details.transactionId?.trim()) {
        return "Card Transaction ID is required";
      }
      if (!details.reference?.trim()) {
        return "Card reference or last 4 digits is required";
      }
      // Validate reference is 4 digits only
      if (!/^\d{4}$/.test(details.reference.replace(/\D/g, ''))) {
        return "Card reference must be 4 digits (e.g., last 4 digits of card)";
      }
    }
    
    if (method === "bank") {
      if (!details.reference?.trim()) {
        return "Bank reference number is required";
      }
    }
    
    return null;
  };

  // Auto-set paid amount when total changes for cash payment
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

    // Check variant-level stock: calculate remaining stock accounting for items already in cart with same size
    const inCartWithThisSize = cart
      .filter(item => item.productId === product._id && item.size === selectedSize)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const availableForThisVariant = product.currentStock - inCartWithThisSize;
    
    if (availableForThisVariant <= 0) {
      toast.error(`No stock available for this${selectedSize ? ` ${selectedSize}` : ''} variant`);
      return;
    }

    const existingItemIndex = cart.findIndex(
      item => item.productId === product._id && item.size === selectedSize
    );

    if (existingItemIndex >= 0) {
      const existingItem = cart[existingItemIndex];
      // Variant-level stock check
      if (existingItem.quantity >= availableForThisVariant) {
        toast.error(`Cannot add more items. Only ${availableForThisVariant} available for this variant`);
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

    toast.success(`${product.name}${selectedSize ? ` (${selectedSize})` : ''} added to cart`);
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

    // ✅ FIX #1: Validate customer information before processing
    let customerError = null;
    if (selectedCustomer?.name) {
      customerError = validateCustomerInfo(selectedCustomer.name, selectedCustomer.phone || "");
    }
    if (customerError) {
      toast.error(customerError);
      return;
    }

    // ✅ FIX #2: Real-time stock validation before processing
    const stockError = validateCartStock();
    if (stockError) {
      toast.error(`Stock validation failed: ${stockError}`);
      return;
    }

    // ✅ FIX #4: Validate payment method specific fields
    const paymentError = validatePaymentDetails(paymentMethod, mobilePaymentDetails);
    if (paymentError) {
      toast.error(paymentError);
      return;
    }

    if (paidAmount < 0) {
      toast.error("Paid amount cannot be negative");
      return;
    }

    if (total > 0 && paidAmount === 0) {
      toast.error("Please enter a paid amount");
      return;
    }

    setIsProcessing(true);

    try {
      // ✅ FIX #3: Include correct discount amount in sale data
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
        discount: calculatedDiscountAmount,
        total,
        paidAmount,
        dueAmount,
        paymentMethod,
        // ✅ FIX #17: Include applied coupon code in sale record
        couponCode: appliedCoupon?.code,
        paymentDetails: ["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) ? {
          phoneNumber: mobilePaymentDetails.phoneNumber,
          transactionId: mobilePaymentDetails.transactionId,
          status: "pending"
        } : paymentMethod === "card" ? {
          transactionId: mobilePaymentDetails.transactionId,
          reference: mobilePaymentDetails.reference
        } : paymentMethod === "bank" ? {
          reference: mobilePaymentDetails.reference
        } : undefined,
        deliveryInfo: deliveryInfo.type === "delivery" ? {
          type: "delivery",
          address: deliveryInfo.address,
          phone: deliveryInfo.phone,
          charges: deliveryInfo.charges
        } : {
          type: "pickup"
        },
      };

      const saleId = await createSale(saleData);
      
      // ✅ FIX #7: Update customer's delivery address for future reuse
      if (selectedCustomer && deliveryInfo.type === "delivery") {
        try {
          await updateCustomer({
            id: selectedCustomer._id,
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            lastDeliveryAddress: deliveryInfo.address,
            lastDeliveryPhone: deliveryInfo.phone
          });
        } catch (error) {
          // Log error but don't fail the sale - address save is secondary
          console.error("Failed to update customer delivery info:", error);
        }
      }
      
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
      toast.error(error instanceof Error ? error.message : "Failed to process sale. Please try again.");
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
                        onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
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
            
            {/* ✅ FIX #17: Coupon Code Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => {
                    const error = validateAndApplyCoupon(couponCode);
                    if (error) {
                      toast.error(error);
                    } else if (couponCode.trim()) {
                      toast.success("Coupon applied successfully!");
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  ✓ Applied: {appliedCoupon.code} - {appliedCoupon.discountValue}{appliedCoupon.discountType === "percentage" ? "%" : "৳"}
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                    }}
                    className="ml-2 text-green-600 hover:text-green-800 font-medium underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            {/* ✅ FIX: Disable discount when coupon applied (mobile) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual Discount {appliedCoupon && <span className="text-gray-500">(Coupon Applied)</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? 100 : undefined}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  disabled={appliedCoupon !== null}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder={discountType === "percentage" ? "0-100" : "Amount in ৳"}
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}
                  disabled={appliedCoupon !== null}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-sm font-medium disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">৳</option>
                </select>
              </div>
              {calculatedDiscountAmount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  💰 Discount: ৳{calculatedDiscountAmount.toLocaleString('en-BD')}
                </p>
              )}
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
                <option value="upay">Upay</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {/* ✅ FIX: Mobile Payment Details with Upay support */}
            {["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  📱 {paymentMethod.toUpperCase()} Payment Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number (required)*
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={mobilePaymentDetails.phoneNumber}
                      onChange={(e) => setMobilePaymentDetails({
                        ...mobilePaymentDetails,
                        phoneNumber: e.target.value
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">11-digit Bangladeshi mobile number</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Transaction ID (required)*
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TXN123456"
                      value={mobilePaymentDetails.transactionId}
                      onChange={(e) => setMobilePaymentDetails({
                        ...mobilePaymentDetails,
                        transactionId: e.target.value
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Confirmation reference from {paymentMethod}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Card Payment Details */}
            {paymentMethod === "card" && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-3">
                  💳 Card Payment Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Transaction ID (required)*
                    </label>
                    <input
                      type="text"
                      placeholder="Card authorization code"
                      value={mobilePaymentDetails.transactionId}
                      onChange={(e) => setMobilePaymentDetails({
                        ...mobilePaymentDetails,
                        transactionId: e.target.value
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Last 4 Digits (required)*
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 5678"
                      maxLength={4}
                      value={mobilePaymentDetails.reference}
                      onChange={(e) => setMobilePaymentDetails({
                        ...mobilePaymentDetails,
                        reference: e.target.value.replace(/\D/g, '')
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Last 4 digits of card</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {paymentMethod === "bank" && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-900 mb-3">
                  🏦 Bank Transfer Details
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reference Number (required)*
                  </label>
                  <input
                    type="text"
                    placeholder="Bank transfer reference"
                    value={mobilePaymentDetails.reference}
                    onChange={(e) => setMobilePaymentDetails({
                      ...mobilePaymentDetails,
                      reference: e.target.value
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bank transaction reference number</p>
                </div>
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
              {calculatedDiscountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {discountType === "percentage" ? `(${discount}%)` : ""}:</span>
                  <span>-৳{calculatedDiscountAmount.toLocaleString('en-BD')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-300">
                <span>Total:</span>
                <span className="text-purple-600">৳{total.toLocaleString('en-BD')}</span>
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
                        // ✅ FIX #11: Show size selection modal instead of prompt()
                        setSizeSelectionModal({ product, isOpen: true });
                        setSelectedSize("");
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

                    {/* ✅ FIX: Size selector with default selected size */}
                    {item.availableSizes.length > 1 && (
                      <div className="mt-2">
                        <select
                          value={item.size || item.availableSizes[0]}
                          onChange={(e) => updateCartItemSize(index, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                        >
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max={discountType === "percentage" ? 100 : undefined}
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={discountType === "percentage" ? "0-100" : "Amount in ৳"}
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-sm font-medium"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">৳</option>
                  </select>
                </div>
                {discount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    💰 Discount: ৳{calculatedDiscountAmount.toLocaleString('en-BD')}
                  </p>
                )}
              </div>

              {/* ✅ FIX: Payment Method with Upay */}
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
                  <option value="upay">Upay</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {/* Mobile Payment Details */}
            {["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  📱 {paymentMethod.toUpperCase()} Payment Details
                </h4>
                <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone Number (required)*
                      </label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={mobilePaymentDetails.phoneNumber}
                        onChange={(e) => setMobilePaymentDetails({
                          ...mobilePaymentDetails,
                          phoneNumber: e.target.value
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">11-digit Bangladeshi mobile number</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Transaction ID (required)*
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., TXN123456"
                        value={mobilePaymentDetails.transactionId}
                        onChange={(e) => setMobilePaymentDetails({
                          ...mobilePaymentDetails,
                          transactionId: e.target.value
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Confirmation reference from {paymentMethod}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Payment Details */}
              {paymentMethod === "card" && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-3">
                    💳 Card Payment Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Transaction ID (required)*
                      </label>
                      <input
                        type="text"
                        placeholder="Card authorization code"
                        value={mobilePaymentDetails.transactionId}
                        onChange={(e) => setMobilePaymentDetails({
                          ...mobilePaymentDetails,
                          transactionId: e.target.value
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last 4 Digits (required)*
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 5678"
                        maxLength={4}
                        value={mobilePaymentDetails.reference}
                        onChange={(e) => setMobilePaymentDetails({
                          ...mobilePaymentDetails,
                          reference: e.target.value.replace(/\D/g, '')
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Last 4 digits of card</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Details */}
              {paymentMethod === "bank" && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-medium text-purple-900 mb-3">
                    🏦 Bank Transfer Details
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reference Number (required)*
                    </label>
                    <input
                      type="text"
                      placeholder="Bank transfer reference"
                      value={mobilePaymentDetails.reference}
                      onChange={(e) => setMobilePaymentDetails({
                        ...mobilePaymentDetails,
                        reference: e.target.value
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Bank transaction reference number</p>
                  </div>
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
                {calculatedDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {discountType === "percentage" ? `(${discount}%)` : ""}:</span>
                    <span>-৳{calculatedDiscountAmount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-300">
                  <span>Total:</span>
                  <span className="text-purple-600">৳{total.toLocaleString('en-BD')}</span>
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
                {paidAmount > total && paidAmount > 0 && (
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

      {/* ✅ FIX #11: Size Selection Modal */}
      {sizeSelectionModal.isOpen && sizeSelectionModal.product && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Select Size for {sizeSelectionModal.product.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {sizeSelectionModal.product.brand} • {sizeSelectionModal.product.color}
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {sizeSelectionModal.product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    selectedSize === size
                      ? "border-purple-600 bg-purple-100 text-purple-900"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:border-purple-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSizeSelectionModal({ product: null, isOpen: false });
                  setSelectedSize("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedSize && sizeSelectionModal.product) {
                    addToCart(sizeSelectionModal.product, selectedSize);
                    setSizeSelectionModal({ product: null, isOpen: false });
                    setSelectedSize("");
                  }
                }}
                disabled={!selectedSize}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add to Cart
              </button>
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
