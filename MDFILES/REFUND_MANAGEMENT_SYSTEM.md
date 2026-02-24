# ✅ রিফান্ড ম্যানেজমেন্ট সিস্টেম - সম্পূর্ণ গাইড

## সিস্টেম ওভারভিউ

একটি সম্পূর্ণ, এন্টারপ্রাইজ-গ্রেড রিফান্ড ম্যানেজমেন্ট সিস্টেম যুক্ত করা হয়েছে যা:

- ✅ সমস্ত বিক্রয় থেকে আংশিক/সম্পূর্ণ রিফান্ড পরিচালনা করে
- ✅ মাল্টি-স্টেজ অনুমোদন ওয়ার্কফ্লো সমর্থন করে
- ✅ স্বয়ংক্রিয় স্টক রিস্টক পরিচালনা করে
- ✅ বিস্তৃত অডিট ট্রেইল বজায় রাখে
- ✅ শাখা-নির্দিষ্ট নীতি সমর্থন করে
- ✅ রিয়েল-টাইম ড্যাশবোর্ড মেট্রিক্স প্রদান করে

---

## 1. ডাটাবেস স্কিমা (Convex/schema.ts)

### A. রিফান্ড টেবিল (`refunds`)

```typescript
refunds: defineTable({
  // পরিচয়
  refundNumber: v.string(),        // "REF-1706123456"
  saleId: v.id("sales"),           // সংযুক্ত বিক্রয় রেকর্ড
  saleNumber: v.string(),          // মূল বিক্রয় নম্বর
  
  // গ্রাহক তথ্য
  customerId: v.optional(v.id("customers")),
  customerName: v.optional(v.string()),
  customerPhone: v.optional(v.string()),
  
  // রিফান্ড আইটেম (আংশিক রিফান্ড সমর্থন)
  items: v.array(v.object({
    productId: v.id("products"),
    productName: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    size: v.optional(v.string()),
    reason: v.string(),            // "defective", "wrong_item", "customer_request"
    condition: v.string(),          // "new", "used", "damaged"
    notes: v.optional(v.string()),
  })),
  
  // আর্থিক বিবরণ
  subtotal: v.number(),
  tax: v.number(),
  discount: v.number(),
  refundAmount: v.number(),        // মোট রিফান্ড টাকা
  refundMethod: v.string(),        // "cash", "mobile_banking", "card", "credit_account"
  originalPaymentMethod: v.string(),
  
  // পেমেন্ট বিপরীতকরণ
  refundDetails: v.optional(v.object({
    transactionId: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    reference: v.optional(v.string()),
    status: v.optional(v.string()),
    remark: v.optional(v.string()),
  })),
  
  // স্ট্যাটাস ট্র্যাকিং
  status: v.string(),              // "pending", "approved", "processed", "completed", "rejected"
  approvalStatus: v.optional(v.string()), // "pending_approval", "approved", "rejected"
  
  // প্রক্রিয়াকরণ বিবরণ
  processedBy: v.optional(v.id("users")),
  processedByName: v.optional(v.string()),
  approvedBy: v.optional(v.id("users")),
  approvedByName: v.optional(v.string()),
  
  // তারিখ
  requestDate: v.number(),
  approvalDate: v.optional(v.number()),
  processedDate: v.optional(v.number()),
  completedDate: v.optional(v.number()),
  
  // কারণ এবং নোট
  refundReason: v.string(),        // "quality_issue", "change_of_mind", "wrong_product"
  refundNotes: v.optional(v.string()),
  internalNotes: v.optional(v.string()),
  
  // রিটার্ন ট্র্যাকিং
  isReturned: v.boolean(),
  returnDate: v.optional(v.number()),
  returnCondition: v.optional(v.string()), // "good", "fair", "damaged"
  inspectionNotes: v.optional(v.string()),
  
  // ইনভেন্টরি প্রভাব
  restockRequired: v.boolean(),
  restockQuantity: v.optional(v.number()),
  restockDate: v.optional(v.number()),
  restockBranchId: v.optional(v.id("branches")),
})
  .index("by_sale", ["saleId"])
  .index("by_branch", ["branchId"])
  .index("by_customer", ["customerId"])
  .index("by_status", ["status"])
  .index("by_approval_status", ["approvalStatus"])
  .index("by_date", ["requestDate"])
  .index("by_refund_method", ["refundMethod"])
```

### B. রিফান্ড অডিট ট্রেইল (`refundAuditTrail`)

```typescript
refundAuditTrail: defineTable({
  refundId: v.id("refunds"),
  refundNumber: v.string(),
  actionType: v.string(),          // "created", "approved", "processed", "completed", "rejected"
  previousStatus: v.optional(v.string()),
  newStatus: v.string(),
  performedBy: v.id("users"),
  performedByName: v.string(),
  timestamp: v.number(),
  notes: v.optional(v.string()),
})
  .index("by_refund", ["refundId"])
  .index("by_date", ["timestamp"])
  .index("by_user", ["performedBy"])
```

### C. রিফান্ড নীতি (`refundPolicies`)

```typescript
refundPolicies: defineTable({
  branchId: v.id("branches"),
  branchName: v.string(),
  
  // মূল নীতি
  allowRefunds: v.boolean(),       // রিফান্ড অনুমোদিত?
  refundWindowDays: v.number(),    // ক্রয়ের পর কত দিনের মধ্যে?
  requireApproval: v.boolean(),    // ম্যানেজার অনুমোদন প্রয়োজন?
  maxRefundPercentage: v.number(), // সর্বোচ্চ রিফান্ড %
  requireReturnedGoods: v.boolean(), // পণ্য ফেরত প্রয়োজন?
  allowPartialRefund: v.boolean(), // আংশিক রিফান্ড অনুমোদিত?
  
  // অটোমেশন
  autoApproveBelow: v.number(),    // এই পরিমাণের নিচে স্বয়ংক্রিয় অনুমোদন
  autoCompleteAfterDays: v.number(), // X দিন পর স্বয়ংক্রিয় সম্পন্ন
  autoRestockRefundedItems: v.boolean(), // স্বয়ংক্রিয় রিস্টক?
  restockPenalty: v.optional(v.number()), // হ্যান্ডলিং পেনাল্টি %
  
  // বিজ্ঞপ্তি
  notifyManagerOnRefund: v.boolean(),
  notifyCustomerOnApproval: v.boolean(),
  notifyCustomerOnCompletion: v.boolean(),
  
  // অডিট
  updatedBy: v.id("users"),
  updatedByName: v.string(),
  lastUpdated: v.number(),
})
  .index("by_branch", ["branchId"])
```

---

## 2. ব্যাকএন্ড API (convex/refunds.ts)

### কোর মিউটেশন

#### ✅ create() - রিফান্ড অনুরোধ তৈরি করুন

```typescript
await createRefund({
  saleId: "sale_id_123",
  items: [
    {
      productId: "product_id",
      productName: "Abaya XL",
      quantity: 1,
      unitPrice: 2500,
      totalPrice: 2500,
      reason: "defective",
      condition: "damaged",
    }
  ],
  subtotal: 2500,
  tax: 250,
  discount: 0,
  refundAmount: 2750,
  refundMethod: "cash",
  refundReason: "quality_issue",
  refundNotes: "Stitching defect",
  restockRequired: true,
});
```

**স্বয়ংক্রিয় কাজ:**
- নীতি যাচাই করে
- রিফান্ড উইন্ডো চেক করে
- অনুমোদনের স্ট্যাটাস নির্ধারণ করে
- অডিট ট্রেইল তৈরি করে

#### ✅ approve() - রিফান্ড অনুমোদন করুন

```typescript
await approveRefund({
  refundId: "refund_id_123",
  approvalNotes: "Approved - Replace with new",
});
```

#### ✅ reject() - রিফান্ড প্রত্যাখ্যান করুন

```typescript
await rejectRefund({
  refundId: "refund_id_123",
  rejectionReason: "Outside 30-day window",
});
```

#### ✅ process() - রিফান্ড প্রক্রিয়া করুন

```typescript
await processRefund({
  refundId: "refund_id_123",
  refundDetails: {
    transactionId: "TXN123",
    status: "success",
  },
});
```

#### ✅ complete() - রিফান্ড সম্পন্ন করুন

```typescript
await completeRefund({
  refundId: "refund_id_123",
  returnCondition: "good",
  inspectionNotes: "Item in original condition",
});
```

স্বয়ংক্রিয়ভাবে:
- স্টক রিস্টক করে (যদি প্রয়োজন হয়)
- স্টক মুভমেন্ট লগ তৈরি করে
- অডিট ট্রেইল আপডেট করে

### কোর কোয়েরি

```typescript
// সমস্ত রিফান্ড
const refunds = useQuery(api.refunds.list, { status: "pending" });

// নির্দিষ্ট বিক্রয়ের রিফান্ড
const saleRefunds = useQuery(api.refunds.getBySale, { saleId });

// অনুমোদনের জন্য অপেক্ষমান
const pending = useQuery(api.refunds.getPendingApproval, {});

// শাখার নীতি
const policy = useQuery(api.refunds.getPolicy, { branchId });

// পরিসংখ্যান
const stats = useQuery(api.refunds.getStatistics, {
  branchId,
  startDate,
  endDate,
});

// অডিট ট্রেইল
const history = useQuery(api.refunds.getAuditTrail, { refundId });
```

---

## 3. ফ্রন্টএন্ড UI (src/components/RefundManagement.tsx)

### UI বৈশিষ্ট্য

#### ট্যাব ১: রিফান্ড তালিকা

```
┌─────────────────────────────────────────────┐
│ Status Filter: [All ▼] | Pending Approvals: 3 │
├─────────────────────────────────────────────┤
│ Refund #  | Sale #   | Customer | Amount  │ Status │
├───────────┼──────────┼──────────┼─────────┼────────┤
│ REF-001   | INV-100  | Ahmed    | ৳2,500  │ Pending│
│ REF-002   | INV-102  | Fatima   | ৳1,200  │ Done   │
│ REF-003   | INV-105  | Hassan   | ৳3,000  │ Reject │
└─────────────────────────────────────────────┘
```

- **ফিল্টার:** স্ট্যাটাস অনুযায়ী
- **ক্লিক করুন:** বিস্তারিত দেখুন এবং পদক্ষেপ নিন

#### ট্যাব ২: নতুন রিফান্ড অনুরোধ

```
শুরু করুন → বিক্রয় নির্বাচন করুন → আইটেম নির্বাচন করুন → পূরণ করুন:
- ত্রুটির কারণ
- পণ্যের অবস্থা
- পছন্দসই রিফান্ড পদ্ধতি
- মন্তব্য
→ জমা দিন
```

#### ট্যাব ৩: নীতি সেটিংস

প্রতিটি শাখা তার নিজস্ব রিফান্ড নীতি কনফিগার করতে পারে:

```
✓ রিফান্ড অনুমোদিত
✓ রিফান্ড উইন্ডো: 30 দিন
✓ ম্যানেজার অনুমোদন প্রয়োজন
✓ ৫০০০ টাকার উপরে অনুমোদন প্রয়োজন
✓ ৫ দিনের নিচে স্বয়ংক্রিয় অনুমোদন
✓ স্বয়ংক্রিয় রিস্টক: হ্যাঁ
✓ গ্রাহক বিজ্ঞপ্তি সক্ষম
```

### মোডাল: রিফান্ড বিস্তারিত

```
╔══════════════════════════════════════╗
║ Refund: REF-001                   ✕ ║
╠══════════════════════════════════════╣
║ Sale Number: INV-100                 ║
║ Refund Amount: ৳2,500                ║
║ Status: Pending Approval             ║
║ Refund Method: Cash                  ║
╠══════════════════════════════════════╣
║ [Approval Notes] ____________________║
║                                      ║
║ [✓ Approve]     [✗ Reject]          ║
║ [Rejection Reason] __________________║
╚══════════════════════════════════════╝
```

---

## 4. ড্যাশবোর্ড ইন্টিগ্রেশন

নতুন মেট্রিক্স কার্ড যুক্ত করা হয়েছে:

### রিফান্ড মেট্রিক্স কার্ড

```
┌─────────────────┐
│ Refunds         │
│  3 (↩️)         │
│ ৳7,200 total    │
│ 1.2% refund rate│
└─────────────────┘
```

### রিফান্ড স্ট্যাটাস প্যানেল

```
Pending Approvals: 3 (⚠️ ACTION REQUIRED)
Completed Refunds: 12 (✓)
Total Refunded: ৳45,600 (1.8% refund rate)
```

---

## 5. সেলস পেজ ইন্টিগ্রেশন

Sales.tsx এ "Manage Refunds" বাটন যুক্ত:

```tsx
// Sales.tsx এ
<button
  onClick={() => setShowRefundManagement(true)}
  className="px-4 py-2 bg-orange-600 text-white rounded"
>
  Manage Refunds
</button>

// RefundManagement কম্পোনেন্ট লোড হয়
```

---

## 6. মেনু ইন্টিগ্রেশন

App.tsx এ "Refunds" মেনু আইটেম যুক্ত:

```tsx
// সকল মেনু তালিকায়
{ id: "refunds", name: "Refunds", icon: "↩️" }

// স্যুইচ কেস
case "refunds":
  return <RefundManagement />;
```

**অ্যাক্সেসযোগ্য:**
- ডেস্কটপ মেনু
- মোবাইল হ্যামবার্গার মেনু
- প্রতিটি শাখায় স্বাধীন অ্যাক্সেস নিয়ন্ত্রণ সহ

---

## 7. ওয়ার্কফ্লো প্রক্রিয়া

### সম্পূর্ণ রিফান্ড জীবনচক্র

```
1. REQUEST (অনুরোধ)
   └─ গ্রাহক বা কর্মচারী রিফান্ড অনুরোধ করে
   └─ সিস্টেম নীতি যাচাই করে
   └─ অডিট ট্রেইল: "Created by [user]"

2. APPROVAL (অনুমোদন)
   ├─ স্বয়ংক্রিয় অনুমোদন (< ৫০০০ টাকা)
   └─ ম্যানেজার অনুমোদন (> ৫০০০ টাকা)
   └─ অডিট ট্রেইল: "Approved by [manager]"

3. PROCESSING (প্রক্রিয়াকরণ)
   └─ নগদ/বিকাশ/কার্ড পরিচালনা করুন
   └─ সেন্ডিং লেনদেন বিস্তারিত
   └─ অডিট ট্রেইল: "Processed by [cashier]"

4. RETURN (রিটার্ন)
   └─ পণ্য অবস্থা পরিদর্শন করুন
   └─ রিস্টক শাখা নির্বাচন করুন
   └─ অডিট ট্রেইল: "Completed by [inspector]"

5. COMPLETION (সমাপ্তি)
   └─ স্টক আপডেট করুন
   └─ স্টক মুভমেন্ট লগ তৈরি করুন
   └─ গ্রাহক বিজ্ঞপ্তি পাঠান
   └─ অডিট ট্রেইল: "Completed"
```

### আংশিক রিফান্ড উদাহরণ

```
মূল বিক্রয়:
  - Abaya XL (Red): ৳2,500
  - Dupatta (Gold): ৳500
  - Subtotal: ৳3,000
  - Tax: ৳300
  - Total: ৳3,300

রিফান্ড অনুরোধ (শুধু Abaya):
  - Abaya XL (Red): 1 পিস ফেরত
  - Refund Amount: ৳2,500
  - Dupatta রেখে যাওয়া হয়

স্টক প্রভাব:
  - Abaya: +1 পিস
  - Dupatta: 0 পরিবর্তন
```

---

## 8. স্বয়ংক্রিয় বৈশিষ্ট্য

### ১. স্বয়ংক্রিয় অনুমোদন

```typescript
if (policy?.autoApproveBelow && refundAmount <= policy.autoApproveBelow) {
  approvalStatus = "approved"; // ৫০০০ এর নিচে স্বয়ংক্রিয়ভাবে অনুমোদিত
}
```

### ২. স্বয়ংক্রিয় রিস্টক

```typescript
if (refund.restockRequired && refund.items) {
  for (const item of refund.items) {
    // স্টক মুভমেন্ট তৈরি করুন
    // প্রোডাক্ট স্টক আপডেট করুন
    // ব্র্যান্চ স্টক আপডেট করুন
  }
}
```

### ৩. স্বয়ংক্রিয় নীতি প্রয়োগ

```typescript
const refundWindow = (Date.now() - saleTime) / (1000 * 60 * 60 * 24);
if (refundWindow > policy.refundWindowDays) {
  throw new Error(`Refund window of ${policy.refundWindowDays} days passed`);
}
```

---

## 9. ডেটা গোপনীয়তা ও নিরাপত্তা

### অডিট ট্রেইল

প্রতিটি পদক্ষেপ রেকর্ড করা হয়:

```typescript
refundAuditTrail: {
  refundId: "ref_001",
  actionType: "approved",
  previousStatus: "pending_approval",
  newStatus: "approved",
  performedBy: "user_123",
  performedByName: "Ahmed Manager",
  timestamp: 1706123456,
  notes: "Approved - Quality issue confirmed",
}
```

### অ্যাক্সেস নিয়ন্ত্রণ

- শুধুমাত্র প্রমাণীকৃত ব্যবহারকারীরা অ্যাক্সেস করতে পারেন
- ম্যানেজার অনুমোদন প্রয়োজনীয়
- শাখা-নির্দিষ্ট দৃশ্যমানতা

---

## 10. ইন্টিগ্রেশন পয়েন্ট

### বিক্রয় সিস্টেমের সাথে

```
Sales → Refund (সম্পর্কযুক্ত)
       └─ সেম গ্রাহক
       └─ সেম আইটেম (নির্বাচিত)
       └─ সেম মূল্য গণনা
```

### পণ্য/স্টক সিস্টেমের সাথে

```
Refund Completion → Stock Movement
                 → Product Stock Update
                 → Branch Stock Update
                 → Inventory Dashboard Refresh
```

### গ্রাহক সিস্টেমের সাথে

```
Refund → Customer Record
      └─ Total Refund Count
      └─ Total Refund Amount
      └─ Last Refund Date
```

---

## 11. রিপোর্টিং

### উপলব্ধ মেট্রিক্স

```typescript
const stats = {
  totalRefunds: 25,
  totalRefundAmount: 125000,
  byStatus: {
    pending: 3,
    approved: 5,
    processed: 8,
    completed: 9,
    rejected: 2,
  },
  byReason: {
    quality_issue: 10,
    change_of_mind: 8,
    wrong_product: 5,
    expired: 2,
  },
  byMethod: {
    cash: 10,
    mobile_banking: 12,
    card: 3,
  },
  refundRate: "3.2%",
  averageRefundAmount: 5000,
}
```

---

## 12. ভবিষ্যত উন্নতি (রোডম্যাপ)

- [ ] রিফান্ড রিপোর্ট (বিস্তৃত)
- [ ] গ্রাহক বিজ্ঞপ্তি (এসএমএস/ইমেইল)
- [ ] রিটার্ন শিপিং লেবেল
- [ ] রিফান্ড চার্জব্যাক ট্র্যাকিং
- [ ] এআই-চালিত জালিয়াতি সনাক্তকরণ
- [ ] মাল্টি-চ্যানেল রিটার্ন

---

## 13. দ্রুত শুরু (Quick Start)

### রিফান্ড অনুরোধ তৈরি করতে:

1. সেলস → Manage Refunds
2. "Start New Refund Request" ক্লিক করুন
3. বিক্রয় নির্বাচন করুন
4. আইটেম এবং কারণ নির্বাচন করুন
5. রিফান্ড পদ্ধতি নির্বাচন করুন
6. জমা দিন

### অনুমোদন করতে:

1. ডাশবোর্ড → "Pending Approvals" কার্ড
2. বা Refunds → Refund List (Pending স্ট্যাটাস)
3. রিফান্ড বিস্তারিত খুলুন
4. অনুমোদন বা প্রত্যাখ্যান করুন

### সম্পন্ন করতে:

1. রিফান্ড বিস্তারিত খুলুন
2. পণ্য অবস্থা নির্বাচন করুন
3. মন্তব্য যোগ করুন
4. "Complete Refund" ক্লিক করুন

---

## সংক্ষিপ্ত

এই রিফান্ড ম্যানেজমেন্ট সিস্টেম:

✅ **সম্পূর্ণ:** সৃষ্টি থেকে সমাপ্তি পর্যন্ত সবকিছু কভার করে
✅ **নমনীয়:** নীতি-চালিত, শাখা-নির্দিষ্ট
✅ **স্বয়ংক্রিয়:** অনেক কাজ স্বয়ংক্রিয়ভাবে হয়
✅ **নিরীক্ষিত:** প্রতিটি পদক্ষেপ ট্র্যাক করা হয়
✅ **সংহত:** বিক্রয়, স্টক এবং গ্রাহক সিস্টেমের সাথে সংযুক্ত
✅ **অ্যাক্সেসযোগ্য:** সমস্ত ডিভাইসে (ডেস্কটপ/মোবাইল)

---

**নির্মাণ তারিখ:** January 31, 2026
**সংস্করণ:** 1.0.0
**স্ট্যাটাস:** ✅ উৎপাদনের জন্য প্রস্তুত
