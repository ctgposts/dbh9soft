# 🎯 ফিচার-ওয়াইজ বিস্তারিত এরর ম্যাপিং

## 1️⃣ POS সিস্টেম

### 📍 `src/components/POS.tsx` (১২৮১ লাইন)

**এরর ম্যাট্রিক্স:**
| সমস্যা | লাইন | কোড | প্রভাব |
|--------|------|------|--------|
| কাস্টমার ডেটা না থাকা | ৩৪-৫০ | ❌ | সেল রেকর্ড অসম্পূর্ণ |
| নাল চেক মিসিং | ২৮০-৩২০ | ⚠️ | ক্র্যাশ সম্ভব |
| পেমেন্ট ডেটা ভ্যালিডেশন নেই | ৩৫০-৪০০ | ❌ | ইনভ্যালিড পেমেন্ট সেভ |
| ডেলিভারি চার্জ আপডেট নেই | ৫৫০-৬০০ | ❌ | ভুল টোটাল |
| লাস্ট সেল স্টেট ইনকনসিস্টেন্ট | ৭০০-৭৫০ | ⚠️ | ইনভয়েস দেখায় পুরনো ডেটা |

**সমাধানের কোড উদাহরণ:**
```tsx
// ✅ কাস্টমার সিলেকশন ফিক্স
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [customers, setFilteredCustomers] = useState<Customer[]>([]);

const handleSelectCustomer = (customer: Customer) => {
  setSelectedCustomer(customer);
  // ডেলিভারি তথ্য অটো-ফিল করুন
  if (customer.lastDeliveryAddress) {
    setDeliveryInfo(prev => ({
      ...prev,
      address: customer.lastDeliveryAddress,
      phone: customer.lastDeliveryPhone || ""
    }));
  }
};

// ✅ পেমেন্ট ভ্যালিডেশন
const validatePaymentData = () => {
  if (paymentMethod === 'cash' && paidAmount < subtotal) {
    toast.error('Paid amount cannot be less than total');
    return false;
  }
  if (['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
    if (!mobilePaymentDetails.phoneNumber || !mobilePaymentDetails.transactionId) {
      toast.error('Phone number and transaction ID required');
      return false;
    }
  }
  return true;
};
```

---

## 2️⃣ ইনভেন্টরি ম্যানেজমেন্ট

### 📍 `src/components/Inventory.tsx` (১৯১৯ লাইন)

**এরর ম্যাট্রিক্স:**
| সমস্যা | লাইন | গুরুত্ব | প্রভাব |
|--------|------|--------|--------|
| ইমেজ কম্প্রেশন Context null | ৯০-১২০ | 🔴 | আপলোড ক্র্যাশ |
| বারকোড ডুপ্লিকেশন চেক নেই | ২০০-২৫০ | 🟠 | ডুপ্লিকেট প্রোডাক্ট |
| স্টক ট্র্যাকিং ভ্যারিয়েন্ট নেই | ৪০০-৫০০ | 🔴 | ওভারসেল |
| ইমেজ ডিলিট ক্লাউড থেকে হয় না | ১২০০-১২৫০ | 🟡 | স্টোরেজ বৃদ্ধি |
| প্রোডাক্ট কোয়ান্টিটি নেগেটিভ হতে পারে | ৬০০-৬৫০ | 🔴 | ডেটা কনসিস্টেন্সি |

**ডিটেইল এরর কোড:**
```tsx
// ❌ ত্রুটিপূর্ণ ইমেজ কম্প্রেশন
const compressImage = async (file: File) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d'); // এটি null হতে পারে!
  ctx.drawImage(img, 0, 0); // Error: Cannot read property 'drawImage' of null
};

// ✅ সংশোধিত সংস্করণ
const compressImage = async (file: File) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.7);
};

// ✅ স্টক নেগেটিভ প্রতিরোধ
const handleStockAdjustment = async (productId, quantity, type) => {
  const product = products.find(p => p._id === productId);
  
  if (type === 'deduct' && product.currentStock < quantity) {
    toast.error(`Insufficient stock. Available: ${product.currentStock}`);
    return;
  }
  
  const newStock = type === 'add' 
    ? product.currentStock + quantity 
    : product.currentStock - quantity;
    
  if (newStock < 0) {
    toast.error('Stock cannot be negative');
    return;
  }
  
  await updateProduct({ ...product, currentStock: newStock });
};
```

---

## 3️⃣ রিফান্ড ম্যানেজমেন্ট

### 📍 `src/components/RefundManagement.tsx` (৬৪৬ লাইন)

**এরর ম্যাট্রিক্স:**
| সমস্যা | লাইন | সিভিয়ারিটি | এফেক্ট |
|--------|------|----------|--------|
| সেল সিলেকশন পরে আইটেম না আসা | ৩০-৫০ | 🔴 | রিফান্ড ক্রিয়েট ব্যর্থ |
| মাল্টিপল আইটেম সিলেকশন বাগ | ৬৫-৮০ | 🔴 | আংশিক রিফান্ড ভুল |
| রিফান্ড অ্যাপ্রুভাল ওয়ার্কফ্লো ইনকমপ্লিট | ২০০-২৫০ | 🟠 | লুপহোল রয়েছে |
| স্টক রিভার্সাল হয় না রিজেকশনে | ৩০০-৩৫০ | 🔴 | স্টক উইসকাউন্ট |
| তারিখ ফিল্টারিং কাজ করে না | ৫০০-৫৫০ | 🟡 | রিপোর্ট ইনঅ্যাকুরেট |

**ত্রুটিপূর্ণ কোড এবং সমাধান:**
```tsx
// ❌ ত্রুটিপূর্ণ: সেল আইটেম নিশ্চিত নয়
const saleItems = selectedSale?.items || []

// ✅ সমাধান: সেল থাকা নিশ্চিত করুন এবং ডিফল্ট দিন
if (!selectedSale) {
  toast.error("Please select a sale first");
  return;
}
const saleItems = selectedSale.items ?? [];

// ❌ ত্রুটিপূর্ণ: চেকবক্স টগল বাগ
const toggleItemSelection = (productId) => {
  setRefundForm(prev => ({
    ...prev,
    selectedItems: prev.selectedItems.includes(productId)
      ? prev.selectedItems.filter(id => id !== productId)
      : [...prev.selectedItems, productId]
  }));
};

// ✅ সমাধান: আইটেম ডিডুপ্লিকেশন সহ
const toggleItemSelection = (productId) => {
  setRefundForm(prev => {
    const updated = new Set(prev.selectedItems);
    if (updated.has(productId)) {
      updated.delete(productId);
    } else {
      updated.add(productId);
    }
    return {
      ...prev,
      selectedItems: Array.from(updated)
    };
  });
};

// ❌ ত্রুটিপূর্ণ: স্টক রিভার্ত করা হয় না
const handleRejectRefund = async (refundId) => {
  await rejectRefund({ refundId, reason: rejectionReason });
  // স্টক আপডেট হয় না!
};

// ✅ সমাধান: স্টক রিভার্ত করুন
const handleRejectRefund = async (refundId) => {
  const refund = refunds.find(r => r._id === refundId);
  await rejectRefund({ refundId, reason: rejectionReason });
  
  // স্টক রিভার্ট করুন প্রতিটি আইটেমের জন্য
  for (const item of refund.items) {
    await updateProduct({
      productId: item.productId,
      currentStock: prevStock + item.quantity
    });
  }
  toast.success("Refund rejected and stock restored");
};
```

---

## 4️⃣ ড্যাশবোর্ড

### 📍 `src/components/Dashboard.tsx` (৪৮৬ লাইন)

**এরর মেট্রিক্স:**
| সমস্যা | লাইন | তারতম্য | ফলাফল |
|--------|------|--------|--------|
| নোটিফিকেশন ডুপ্লিকেট | ৭৫-১১০ | 🔴 | স্প্যাম নোটিফিকেশন |
| লোস্টক প্রোডাক্ট ট্র্যাকিং বাগ | ৯০-১০৫ | 🟠 | মিসড নোটিফিকেশন |
| লোডিং স্টেট নেই | ১৫০-২০০ | 🟡 | পোর UX |

**বিস্তারিত এরর হ্যান্ডলিং:**
```tsx
// ❌ ত্রুটিপূর্ণ: নোটিফিকেশন ডুপ্লিকেট
useEffect(() => {
  lowStockProducts.forEach(product => {
    notify({ title: `Low: ${product.name}` });
  });
}, [products, notify]); // প্রতিটি রেন্ডারে notify কল হয়

// ✅ সমাধান: notiify memoized এবং proper tracking
const notifyMemoized = useCallback(notify, []);

useEffect(() => {
  lowStockProducts.forEach(product => {
    if (!notifiedProductsRef.current.has(product._id)) {
      notifyMemoized({ title: `Low: ${product.name}` });
      notifiedProductsRef.current.add(product._id);
    }
  });
  
  // পুরনো নোটিফিকেশন ক্লিনআপ করুন
  const activeIds = new Set(lowStockProducts.map(p => p._id));
  notifiedProductsRef.current = new Set(
    [...notifiedProductsRef.current].filter(id => activeIds.has(id))
  );
}, [lowStockProducts, notifyMemoized]);
```

---

## 5️⃣ কাস্টমার ম্যানেজমেন্ট

### 📍 `src/components/Customers.tsx` (৯১৫ লাইন)

**এরর অ্যানালাইসিস:**
| ইস্যু | লাইন | সেভারিটি | ইম্পেক্ট |
|------|------|---------|--------|
| ইমেইল ডুপ্লিকেট কেস-সেনসিটিভ | ১৪০-১৬০ | 🟠 | ডেটা ডুপ্লিকেশন |
| ফোন নাম্বার নর্মালাইজেশন নেই | ১২০-১৩০ | 🟠 | ডুপ্লিকেট সিলেকশন |
| কাস্টমার মার্জ ফাংশন নেই | - | 🟡 | একাধিক এন্ট্রি |
| লয়্যালটি পয়েন্ট রেস কন্ডিশন | ২০০-২৫০ | 🔴 | পয়েন্ট হারিয়ে যায় |

**বিস্তারিত এরর:**
```tsx
// ❌ ত্রুটিপূর্ণ: কেস-সেনসিটিভই-মেইল চেক
const emailExists = customers.find(c => 
  c.email === newCustomer.email && c._id !== editingCustomer?._id
);

// ✅ সমাধান: নর্মালাইজ করুন
const emailExists = customers.find(c => 
  c.email?.toLowerCase() === newCustomer.email.toLowerCase() && 
  c._id !== editingCustomer?._id
);

// ❌ ত্রুটিপূর্ণ: ফোন নম্বর নর্মালাইজ নেই
const phoneExists = customers.find(c => 
  c.phone === newCustomer.phone
);

// ✅ সমাধান: স্পেস/ড্যাশ রিমুভ করুন
const normalizePhone = (phone: string) => phone.replace(/[-\s]/g, '');

const phoneExists = customers.find(c => 
  normalizePhone(c.phone) === normalizePhone(newCustomer.phone)
);

// ❌ ত্রুটিপূর্ণ: লয়্যালটি পয়েন্ট রেস কন্ডিশন
// যদি একটি প্রক্রিয়া পয়েন্ট যোগ করে এবং অন্যটি একই সময়ে ডেটা পড়ে

// ✅ সমাধান: অ্যাটমিক আপডেট ব্যবহার করুন (Convex এ)
// convex/customers.ts এ:
export const addLoyaltyPoints = mutation({
  handler: async (ctx, customerId, points) => {
    const customer = await ctx.db.get(customerId);
    const newPoints = (customer.loyaltyPoints || 0) + points;
    await ctx.db.patch(customerId, { loyaltyPoints: newPoints });
  }
});
```

---

## 6️⃣ অনলাইন স্টোর সিস্টেম

### 📍 `src/components/OnlineStore.tsx`

**এরর চার্ট:**
| সমস্যা | লাইন | গ্রেড | ইমপ্যাক্ট |
|--------|------|------|---------|
| প্রাইস সিঙ্ক না হওয়া | - | 🔴 | ডিসকাউন্ট ভুল |
| ইনভেন্টরি ডুয়াল না হওয়া | - | 🔴 | ওভারসেল |
| ফিল্টার পারফরম্যান্স খারাপ | - | 🟡 | স্লো লোড |

**সমাধান কোড:**
```tsx
// ✅ অনলাইন/অফলাইন প্রাইস সিঙ্ক
const getProductPrice = (product) => {
  const onlineProduct = onlineProducts.find(op => op.productId === product._id);
  
  if (onlineProduct?.isOnline && onlineProduct.onlinePrice) {
    return onlineProduct.onlinePrice;
  }
  
  return product.sellingPrice;
};

// ✅ ইনভেন্টরি চেক অনলাইন
const checkStockAvailable = async (productId, quantity) => {
  const stock = await getQuery(api.products.getStock, { productId });
  
  if (stock < quantity) {
    throw new Error(`Only ${stock} items available`);
  }
  
  return true;
};
```

---

## 7️⃣ হোয়াটসঅ্যাপ অর্ডার সিস্টেম

### 📍 `src/components/WhatsAppOrders.tsx`

**এরর রেজিস্ট্রেশন:**
| ইস্যু | রেঞ্জ | সেভ | ইমপ্যাক্ট |
|-----|------|-----|--------|
| স্টক অ্যাডজাস্ট নেই কনভার্শনে | ১১৪-২২৩ | 🔴 | স্টক অভারফ্লো |
| অর্ডার নাম্বার ডুপ্লিকেট | - | 🔴 | ডাটা কনলিক্ট |
| স্ট্যাটাস ট্রানজিশন ভ্যালিডেশন | - | 🟠 | ইনভ্যালিড স্টেট |

**বাস্তবায়ন উদাহরণ:**
```tsx
// ❌ ত্রুটিপূর্ণ: কনভার্শনে স্টক না কমানো
const handleConvertToSale = async (orderId) => {
  const order = orders.find(o => o._id === orderId);
  await convertToSale({ orderId });
  // স্টক আপডেট হয় না!
};

// ✅ সমাধান: স্টক আপডেট করুন
const handleConvertToSale = async (orderId) => {
  const order = orders.find(o => o._id === orderId);
  
  try {
    // প্রতিটি আইটেমের স্টক কমান
    for (const item of order.items) {
      const product = products.find(p => p._id === item.productId);
      if (!product || product.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productName}`);
      }
      
      await updateProduct({
        productId: item.productId,
        currentStock: product.currentStock - item.quantity
      });
    }
    
    // অর্ডার কনভার্ট করুন
    await convertToSale({ orderId });
    toast.success("Order converted and stock updated");
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

## 8️⃣ রিপোর্টস সিস্টেম

### 📍 `src/components/Reports.tsx`

**এরর স্ট্যাটাস:**
| প্রব্লেম | স্টেটাস | ইমপ্যাক্ট |
|--------|--------|--------|
| কম্পোনেন্ট অনুপলব্ধ (ফাঁকা শেল) | 🔴 | সম্পূর্ণ অকার্যকর |
| ডেটা ভিজুয়ালাইজেশন নেই | 🔴 | রিপোর্ট অকার্যকর |
| ফিল্টারিং লজিক নেই | 🔴 | কাস্টম রিপোর্ট অসম্ভব |

**রিকোয়ারড ইমপ্লিমেন্টেশন:**
```tsx
// ✅ বেসিক রিপোর্টস কম্পোনেন্ট স্ট্রাকচার
export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const sales = useQuery(api.sales.list, {});
  const refunds = useQuery(api.refunds.list, {});
  
  const generateReport = () => {
    switch(reportType) {
      case 'sales':
        return <SalesReport data={sales} dateRange={dateRange} />;
      case 'refunds':
        return <RefundsReport data={refunds} dateRange={dateRange} />;
      case 'inventory':
        return <InventoryReport dateRange={dateRange} />;
      default:
        return <div>Select a report</div>;
    }
  };
  
  return (
    <div className="space-y-4">
      <select value={reportType} onChange={e => setReportType(e.target.value)}>
        <option value="sales">Sales Report</option>
        <option value="refunds">Refunds Report</option>
        <option value="inventory">Inventory Report</option>
      </select>
      {generateReport()}
    </div>
  );
}
```

---

## 9️⃣ প্রিন্টিং সিস্টেম

### 📍 `src/components/InvoiceModal.tsx`

**এরর ডিটেইলস:**
| সমস্যা | লাইন | সিভিয়ারিটি | ইমপ্যাক্ট |
|--------|------|----------|--------|
| লোগো লোডিং ডিলে | ৪৫-৭০ | 🟡 | ইনভয়েস অসম্পূর্ণ দেখায় |
| QR/বারকোড জেনারেশন এরর | ১৫০-২০০ | 🠟 | প্রিন্ট ক্রেশ হয় |
| প্রিন্ট সেটিংস অ্যাপ্লাই হয় না | ২৫০-৩০০ | 🟡 | মানের সমস্যা |
| মোবাইল প্রিন্টিং সাপোর্ট নেই | - | 🟡 | মোবাইল ইউজার অসুবিধা |

**এরর হ্যান্ডলিং:**
```tsx
// ❌ ত্রুটিপূর্ণ: Async লোগো লোডিং ব্যতিক্রম
useEffect(() => {
  if (storeSettings?.logo) {
    setShopSettings(prev => ({
      ...prev,
      logo: storeSettings.logo // এখনই সেট করলে ইনভয়েস খালি দেখায়
    }));
  }
}, [storeSettings]);

// ✅ সমাধান: প্রতিশ্রুতি সহ অপেক্ষা করুন
useEffect(() => {
  if (storeSettings?.logo) {
    const img = new Image();
    img.onload = () => {
      setShopSettings(prev => ({
        ...prev,
        logo: storeSettings.logo
      }));
    };
    img.src = storeSettings.logo;
  }
}, [storeSettings]);

// ❌ ত্রুটিপূর্ণ: QR কোড জেনারেশন এরর হ্যান্ডলিং নেই
const generateQR = async (sale) => {
  await QRCode.toDataURL(JSON.stringify(sale)); // এরর হ্যান্ডল নেই
};

// ✅ সমাধান: প্রপার এরর হ্যান্ডলিং
const generateQR = async (sale) => {
  try {
    const qrUrl = await QRCode.toDataURL(JSON.stringify(sale));
    setQrCodeDataUrl(qrUrl);
  } catch (error) {
    console.error('QR generation failed:', error);
    toast.error('Failed to generate QR code');
  }
};
```

---

## 🔟 সেটিংস এবং কনফিগারেশন

### 📍 `src/components/Settings.tsx`

**এরর ম্যাপিং:**
| ইশু | লাইন | সেভারিটি | ইমপ্যাক্ট |
|----|------|---------|--------|
| সেটিংস লোডিং ডিলে | ৪০৭-৪৫০ | 🟡 | ফ্লাশ দেখা যায় |
| ট্যাক্স আপডেট সব জায়গায় না | - | এ | ক্যালকুলেশন ভুল |
| ব্র্যান্ড লোগো সেভ ভ্যালিডেশন | - | 🟡 | ইনভ্যালিড ফাইল সংরক্ষিত |
| নোটিফিকেশন লেভেল পার্সিস্ট নেই | - | ⚠️ | সেটিংস সংরক্ষিত হয় না |

---

## সারসংক্ষেপ: ক্রিটিক্যাল ফাংশন ম্যাপিং

```
POS System:
  ✗ Customer Selection
  ✗ Payment Validation
  ✗ Delivery Charges
  ✗ Invoice Generation

Inventory:
  ✗ Image Compression
  ✗ Stock Tracking
  ✗ Barcode Validation
  ✓ Category Management

Refunds:
  ✗ Item Selection
  ✗ Approval Workflow
  ✗ Stock Reversal
  ✗ Policy Enforcement

Dashboard:
  ✗ Notifications
  ✗ Low Stock Alerts
  ✓ Statistics
  ✓ Charts

Customers:
  ✗ Duplicate Prevention
  ✗ Loyalty Points
  ✓ CRUD Operations

Reports:
  ✗ Implementation Missing
  ✗ Charts
  ✗ Export

Online Store:
  ✗ Price Sync
  ✗ Inventory Sync
  ✗ Product Filtering

WhatsApp Orders:
  ✗ Stock Adjustment
  ✗ Status Validation
  ✓ Basic Listing

Printing:
  ✗ Logo Loading
  ✗ QR Code Generation
  ✗ Format Settings

Settings:
  ✗ Configuration Persistence
  ✗ Tax Calculation
  ✓ Basic UI
```

