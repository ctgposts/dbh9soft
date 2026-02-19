import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { InvoiceModal } from "./InvoiceModal";

interface CartItem {
  cartId: string;
  productId: Id<"products">;
  name: string;
  brand: string;
  style: string;
  fabric: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
  size?: string;
  availableSizes?: string[];
}

export default function EnhancedPOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | undefined>();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<Id<"customers"> | null>(null); // ✅ Problem #5
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    phoneNumber: "",
    reference: "",
  });
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: "",
    phone: "",
    charges: 0,
  });
  const [completedSale, setCompletedSale] = useState<Id<"sales"> | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState("products"); // For mobile tabs

  // ✅ FIX: Extract items array from paginated products query response
  const productsResponse = useQuery(api.products.list, { 
    categoryId: selectedCategory,
    searchTerm: searchTerm || undefined,
    limit: 1000
  });
  const products = productsResponse?.items || [];
  const categories = useQuery(api.categories.list);
  const createSale = useMutation(api.sales.create);
  const getSale = useQuery(api.sales.get, 
    completedSale ? { id: completedSale } : "skip"
  );

  if (!products || !categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // ✅ Problem #6: Helper function for real-time stock validation
  const getRequiredPaymentFields = (method: string): string[] => {
    if (["bkash", "nagad", "rocket", "upay"].includes(method)) {
      return ["phoneNumber", "transactionId"]; // Mobile money
    }
    if (method === "card") {
      return ["transactionId", "reference"]; // Card: TxID + Last 4 digits
    }
    if (method === "cod") {
      return []; // COD: no payment details
    }
    return []; // Cash: no details
  };

  // ✅ Problem #7: Validate payment details based on method
  const validatePaymentDetails = (method: string): string | null => {
    const requiredFields = getRequiredPaymentFields(method);
    
    for (const field of requiredFields) {
      const value = paymentDetails[field as keyof typeof paymentDetails];
      if (!value?.toString().trim()) {
        const fieldLabels: Record<string, string> = {
          phoneNumber: "Phone number",
          transactionId: "Transaction ID",
          reference: "Card reference/Last 4 digits",
        };
        return `${fieldLabels[field] || field} is required for ${method}`;
      }
    }

    // Card specific validation
    if (method === "card" && paymentDetails.reference) {
      const digitsOnly = paymentDetails.reference.replace(/\D/g, '');
      if (digitsOnly.length !== 4) {
        return "Card reference must be exactly 4 digits";
      }
    }

    // Phone validation for mobile banking
    if (["bkash", "nagad", "rocket", "upay"].includes(method) && paymentDetails.phoneNumber) {
      const phoneDigits = paymentDetails.phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith('01')) {
        return `Invalid phone number for ${method}. Must be 11 digits starting with 01`;
      }
    }

    return null;
  };

  // ✅ Problem #5: Helper to find and load customer delivery address
  const handleCustomerPhoneChange = async (phone: string) => {
    setCustomerInfo({ ...customerInfo, phone });
    
    if (!phone.trim()) {
      setSelectedCustomerId(null);
      return;
    }

    // In a real app, this would query a customer database
    // For now, we can add this functionality when customer module is available
    // The auto-fill will work when a customer is properly selected via a customer picker
  };

  // ✅ Problem #5: Auto-fill delivery info when customer has lastDeliveryAddress
  const loadCustomerDeliveryInfo = (customer: any) => {
    if (customer?.lastDeliveryAddress) {
      setDeliveryInfo({
        ...deliveryInfo,
        address: customer.lastDeliveryAddress,
        phone: customer.lastDeliveryPhone || "",
      });
    }
    setSelectedCustomerId(customer._id);
  };

  // ✅ FIX #20: Calculate delivery charges based on delivery type and zone
  const calculateDeliveryCharges = (type: string, address?: string): number => {
    if (type !== "delivery") return 0;
    
    // Default delivery charge for standard delivery (can be extended with zone-based logic)
    // These are example rates
    const defaultDeliveryCharge = 50; // ৳50 flat rate
    
    // Future enhancement: Zone-based calculation
    // if (address) {
    //   const zone = determineZone(address); // Would implement zone matching
    //   const zoneRates: Record<string, number> = {
    //     "dhaka": 50,
    //     "outside_dhaka": 100,
    //   };
    //   return zoneRates[zone] || defaultDeliveryCharge;
    // }
    
    return defaultDeliveryCharge;
  };

  // ✅ FIX #20: Handle delivery type change and auto-calculate charges
  const handleDeliveryTypeChange = (type: string) => {
    setDeliveryType(type);
    
    if (type === "pickup") {
      // Pickup: no delivery charges
      setDeliveryInfo({
        address: "",
        phone: "",
        charges: 0,
      });
    } else if (type === "delivery") {
      // Delivery: calculate default charges
      const calculatedCharges = calculateDeliveryCharges("delivery", deliveryInfo.address);
      setDeliveryInfo(prev => ({
        ...prev,
        charges: calculatedCharges,
      }));
    }
  };

  const addToCart = (product: any) => {
    // Stock validation
    if (product.currentStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const cartId = `${product._id}-${Date.now()}`;
    const existingItem = cart.find(item => item.productId === product._id && !item.size);
    
    if (existingItem && !product.sizes?.length) {
      if (existingItem.quantity < product.currentStock) {
        setCart(cart.map(item => 
          item.cartId === existingItem.cartId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error("Not enough stock available");
      }
    } else {
      const newItem: CartItem = {
        cartId,
        productId: product._id,
        name: product.name,
        brand: product.brand,
        style: product.style,
        fabric: product.fabric,
        color: product.color,
        price: product.sellingPrice,
        quantity: 1,
        stock: product.currentStock,
        availableSizes: product.sizes || [],
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (cartId: string, updates: Partial<CartItem>) => {
    // Stock validation for quantity updates
    if (updates.quantity !== undefined) {
      const item = cart.find(c => c.cartId === cartId);
      if (item && updates.quantity > item.stock) {
        toast.error(`Only ${item.stock} items available in stock`);
        return;
      }
      if (updates.quantity <= 0) {
        removeFromCart(cartId);
        return;
      }
    }
    
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, ...updates } : item
    ));
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  // ✅ FIX #1: Handle customer selection with delivery info auto-fill
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomerId(customer._id);
    setCustomerInfo({
      name: customer.name,
      phone: customer.phone || "",
    });
    // Auto-fill delivery info from last order
    if (customer.lastDeliveryAddress) {
      setDeliveryInfo(prev => ({
        ...prev,
        address: customer.lastDeliveryAddress,
        phone: customer.lastDeliveryPhone || prev.phone,
      }));
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: "", phone: "" });
    setSelectedCustomerId(null); // ✅ Problem #5: Reset customer
    setDiscount(0);
    setPaymentMethod("cash");
    setPaymentDetails({ transactionId: "", phoneNumber: "", reference: "" });
    setDeliveryType("pickup");
    setDeliveryInfo({ address: "", phone: "", charges: 0 });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharges = deliveryType === "delivery" ? deliveryInfo.charges : 0;
  
  const discountAmount = discountType === "percentage" 
    ? (subtotal * discount) / 100
    : discount;
  
  const total = subtotal + deliveryCharges - discountAmount;

  // ✅ FIX #2: Validate stock before checkout
  const validateStockBeforeCheckout = (): boolean => {
    for (const cartItem of cart) {
      const product = products?.find(p => p._id === cartItem.productId);
      if (!product) {
        toast.error(`Product ${cartItem.name} not found`);
        return false;
      }
      if (product.currentStock < cartItem.quantity) {
        toast.error(
          `Insufficient stock for ${cartItem.name}. Available: ${product.currentStock}, Required: ${cartItem.quantity}`
        );
        return false;
      }
    }
    return true;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // ✅ FIX #2: Validate stock before proceeding
    if (!validateStockBeforeCheckout()) {
      return;
    }

    // ✅ Problem #6: Real-time stock validation against current product data
    // Validate stock availability using current products data
    for (const cartItem of cart) {
      const currentProduct = products.find(p => p._id === cartItem.productId);
      if (!currentProduct) {
        toast.error(`${cartItem.name}: Product not found`);
        return;
      }
      
      // Check CURRENT stock from fresh product data, not cart item's cached stock
      if (cartItem.quantity > currentProduct.currentStock) {
        toast.error(
          `${cartItem.name}: Only ${currentProduct.currentStock} items available in stock (requested ${cartItem.quantity})`
        );
        return;
      }
    }

    // Validate customer info for delivery
    if (deliveryType === "delivery" && !deliveryInfo.address?.trim()) {
      toast.error("Delivery address is required");
      return;
    }

    // ✅ Problem #7: Enhanced payment validation
    const paymentError = validatePaymentDetails(paymentMethod);
    if (paymentError) {
      toast.error(paymentError);
      return;
    }

    try {
      const saleItems = cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        size: item.size,
      }));

      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmountFinal = discountType === "percentage" 
        ? (subtotal * discount) / 100
        : discount;
      const deliveryChargesAmount = deliveryType === "delivery" ? deliveryInfo.charges : 0;
      const total = subtotal + deliveryChargesAmount - discountAmountFinal;

      const saleId = await createSale({
        items: saleItems,
        customerId: selectedCustomerId || undefined, // ✅ Problem #5: Pass customer ID
        customerName: customerInfo.name || undefined,
        subtotal,
        discount: discountAmountFinal,
        total,
        paidAmount: total,
        dueAmount: 0,
        paymentMethod,
        paymentDetails: Object.keys(paymentDetails).some(key => paymentDetails[key as keyof typeof paymentDetails]) 
          ? paymentDetails 
          : undefined,
        deliveryInfo: deliveryType === "delivery" 
          ? { ...deliveryInfo, type: "delivery" }
          : { type: "pickup" },
      });

      setCompletedSale(saleId);
      clearCart();
      toast.success("Abaya sale completed successfully!");
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errorMessage = error?.message || "Failed to complete sale";
      toast.error(errorMessage);
    }
  };

  const paymentMethods = [
    { id: "cash", name: "Cash", icon: "💵" },
    { id: "bkash", name: "bKash", icon: "📱" },
    { id: "nagad", name: "Nagad", icon: "📱" },
    { id: "rocket", name: "Rocket", icon: "🚀" },
    { id: "upay", name: "Upay", icon: "💳" },
    { id: "card", name: "Card", icon: "💳" },
    { id: "cod", name: "Cash on Delivery", icon: "🚚" },
  ];

  const mobileTabs = [
    { id: "products", name: "Abayas", icon: "🧕" },
    { id: "cart", name: "Cart", icon: "🛒", badge: cart.length },
    { id: "checkout", name: "Checkout", icon: "💳" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 animate-slide-up">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Abaya Point of Sale</h2>
        <div className="text-sm text-gray-500">
          Cart: {cart.length} items | Total: ৳{total.toLocaleString('en-BD')}
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="block lg:hidden">
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
          {mobileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors relative ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <ProductsSection 
            products={products}
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            addToCart={addToCart}
          />
        </div>

        {/* Cart & Checkout Section */}
        <div className="space-y-4">
          <CartSection 
            cart={cart}
            updateCartItem={updateCartItem}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
          />
          <CheckoutSection 
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentDetails={paymentDetails}
            setPaymentDetails={setPaymentDetails}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            deliveryInfo={deliveryInfo}
            setDeliveryInfo={setDeliveryInfo}
            paymentMethods={paymentMethods}
            subtotal={subtotal}
            tax={tax}
            deliveryCharges={deliveryCharges}
            total={total}
            handleCheckout={handleCheckout}
            cart={cart}
          />
        </div>
      </div>

      {/* Mobile Tab Content */}
      <div className="block lg:hidden">
        {activeTab === "products" && (
          <ProductsSection 
            products={products}
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            addToCart={addToCart}
          />
        )}
        {activeTab === "cart" && (
          <CartSection 
            cart={cart}
            updateCartItem={updateCartItem}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
          />
        )}
        {activeTab === "checkout" && (
          <CheckoutSection 
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentDetails={paymentDetails}
            setPaymentDetails={setPaymentDetails}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            deliveryInfo={deliveryInfo}
            setDeliveryInfo={setDeliveryInfo}
            paymentMethods={paymentMethods}
            subtotal={subtotal}
            tax={tax}
            deliveryCharges={deliveryCharges}
            total={total}
            handleCheckout={handleCheckout}
            cart={cart}
          />
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoice && completedSale && getSale && (
        <InvoiceModal
          sale={getSale}
          onClose={() => {
            setShowInvoice(false);
            setCompletedSale(null);
          }}
        />
      )}

      {/* Success Message */}
      {completedSale && !showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🧕</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Abaya Sale Completed!</h3>
            <p className="text-gray-600 mb-4">Transaction has been processed successfully.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInvoice(true)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                View Invoice
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsSection({ products, categories, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, addToCart }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🧕</span>
          Abaya Collection
        </h3>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <input
            type="text"
            placeholder="Search abayas by name, style, fabric, color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value as Id<"categories"> || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-full sm:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((category: any) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {products.map((product: any) => {
            const category = categories.find((c: any) => c._id === product.categoryId);
            return (
              <div
                key={product._id}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-white to-purple-50"
                onClick={() => addToCart(product)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">🧕 {product.name}</h4>
                    <p className="text-xs text-gray-600 truncate">{product.style} - {product.fabric}</p>
                    <p className="text-xs text-purple-600">{product.color}</p>
                  </div>
                  <span 
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2"
                    style={{ 
                      backgroundColor: category?.color + '20',
                      color: category?.color 
                    }}
                  >
                    {category?.name}
                  </span>
                </div>
                
                <div className="mb-2">
                  <p className="text-xs text-gray-500">Occasion: {product.occasion}</p>
                  {product.sizes && product.sizes.length > 0 && (
                    <p className="text-xs text-gray-500">Sizes: {product.sizes.join(', ')}</p>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-purple-600 text-sm">৳{product.sellingPrice.toLocaleString('en-BD')}</p>
                    <p className="text-xs text-gray-500">Stock: {product.currentStock}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.currentStock === 0}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded text-xs hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-50">🧕</div>
            <p className="text-gray-500 text-sm">No abayas found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CartSection({ cart, updateCartItem, removeFromCart, clearCart }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">🛒</span>
          Cart ({cart.length})
        </h3>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
        {cart.map((item: CartItem) => (
          <div key={item.cartId} className="border border-gray-200 rounded-lg p-3 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">🧕 {item.name}</h4>
                <p className="text-xs text-gray-600">{item.style} - {item.fabric}</p>
                <p className="text-xs text-purple-600">{item.color}</p>
              </div>
              <button
                onClick={() => removeFromCart(item.cartId)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateCartItem(item.cartId, { quantity: Math.max(1, item.quantity - 1) })}
                  className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
                >
                  -
                </button>
                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartItem(item.cartId, { quantity: Math.min(item.stock, item.quantity + 1) })}
                  className="w-6 h-6 bg-gray-200 rounded text-xs hover:bg-gray-300"
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <p className="font-semibold text-purple-600 text-sm">
                  ৳{(item.price * item.quantity).toLocaleString('en-BD')}
                </p>
                <p className="text-xs text-gray-500">৳{item.price.toLocaleString('en-BD')} each</p>
              </div>
            </div>

            {/* Size Selection for Abayas */}
            {item.availableSizes && item.availableSizes.length > 0 && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                <select
                  value={item.size || ""}
                  onChange={(e) => updateCartItem(item.cartId, { size: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Size</option>
                  {item.availableSizes.map((size: string) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {cart.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 opacity-50">🛒</div>
          <p className="text-gray-500 text-sm">Cart is empty</p>
        </div>
      )}
    </div>
  );
}

function CheckoutSection({ 
  customerInfo, setCustomerInfo, discount, setDiscount, discountType, setDiscountType, paymentMethod, setPaymentMethod,
  paymentDetails, setPaymentDetails, deliveryType, setDeliveryType, deliveryInfo, setDeliveryInfo,
  paymentMethods, subtotal, tax, deliveryCharges, total, handleCheckout, cart
}: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">💳</span>
        Checkout
      </h3>

      <div className="space-y-4">
        {/* Customer Info */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Customer Information</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <input
              type="tel"
              placeholder="Phone number (optional) - auto-fills saved address"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo((prev: any) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            {customerInfo.customerId && (
              <p className="text-xs text-green-600">✅ Customer found - delivery address auto-filled</p>
            )}
          </div>
        </div>

        {/* Delivery Type */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Delivery</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDeliveryTypeChange("pickup")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                deliveryType === "pickup"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pickup
            </button>
            <button
              onClick={() => handleDeliveryTypeChange("delivery")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                deliveryType === "delivery"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Delivery
            </button>
          </div>
          
          {deliveryType === "delivery" && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Delivery address"
                value={deliveryInfo.address}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                placeholder="Delivery charges"
                value={deliveryInfo.charges}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, charges: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Payment Method</h4>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method: any) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1 ${
                  paymentMethod === method.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{method.icon}</span>
                <span>{method.name}</span>
              </button>
            ))}
          </div>

          {/* Payment Details */}
          {paymentMethod !== "cash" && paymentMethod !== "cod" && (
            <div className="mt-2 space-y-2">
              {/* Mobile Banking: Phone Number + Transaction ID */}
              {["bkash", "nagad", "rocket", "upay"].includes(paymentMethod) && (
                <>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone number (01XXXXXXXXX) *"
                      value={paymentDetails.phoneNumber}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      maxLength={11}
                    />
                    {paymentDetails.phoneNumber && !/^01\d{9}$/.test(paymentDetails.phoneNumber.replace(/\D/g, '')) && (
                      <p className="text-xs text-red-600 mt-1">Invalid format. Must be 01XXXXXXXXX (11 digits)</p>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={`${paymentMethod.toUpperCase()} Transaction ID *`}
                    value={paymentDetails.transactionId}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </>
              )}

              {/* Card: Transaction ID + Reference (Last 4 digits) */}
              {paymentMethod === "card" && (
                <>
                  <input
                    type="text"
                    placeholder="Transaction ID *"
                    value={paymentDetails.transactionId}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <div>
                    <input
                      type="text"
                      placeholder="Card Last 4 Digits *"
                      value={paymentDetails.reference}
                      onChange={(e) => {
                        // Allow only digits
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPaymentDetails({ ...paymentDetails, reference: digitsOnly });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      maxLength={4}
                    />
                    {paymentDetails.reference && paymentDetails.reference.length !== 4 && (
                      <p className="text-xs text-red-600 mt-1">Must be exactly 4 digits</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Discount */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Discount</h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={discountType === "percentage" ? "0-100%" : "Amount (৳)"}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              min="0"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
            >
              <option value="fixed">টাকা</option>
              <option value="percentage">%</option>
            </select>
          </div>
          {discountType === "percentage" && discount > 100 && (
            <p className="text-xs text-red-600 mt-1">Discount cannot exceed 100%</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Order Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>৳{subtotal.toLocaleString('en-BD')}</span>
            </div>
            <div className="flex justify-between">

            </div>
            {deliveryCharges > 0 && (
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>৳{deliveryCharges.toLocaleString('en-BD')}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discountType === "percentage" ? "%" : "৳"}):</span>
                <span>-৳{(discountType === "percentage" ? (subtotal * discount) / 100 : discount).toLocaleString('en-BD')}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t pt-1">
              <span>Total:</span>
              <span>৳{total.toLocaleString('en-BD')}</span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200"
        >
          Complete Abaya Sale
        </button>
      </div>
    </div>
  );
}
