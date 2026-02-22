# Undo Sale Feature - Testing Guide

## কোড ভেরিফিকেশন ✅

আমি নিচের বিষয়গুলো ভেরিফাই করেছি:

### 1. **Refunds Complete Mutation** ✅
**ফাইল:** [convex/refunds.ts](convex/refunds.ts#L339-L510)

✅ **সব স্টেপ ইমপ্লিমেন্ট করা হয়েছে:**

```typescript
✅ STEP 1: Mark sale as "cancelled"
   - Sale status পরিবর্তন হয়েছে: status = "cancelled"
   
✅ STEP 2: Record payment reversal
   - Payment amount ডকুমেন্ট করা হয়
   - Audit trail এ রেকর্ড থাকবে
   
✅ STEP 3: Restore inventory
   - Stock movements তৈরি হয় type = "in"
   - Product currentStock বৃদ্ধি পায়
   - Branch stock আপডেট হয়
   
✅ STEP 4: Reverse loyalty points
   - Points transactions যোগ হয় type = "refund"
   - Customer loyaltyPoints হ্রাস পায়
   
✅ STEP 5: Discount reversal
   - Audit trail এ নথিভুক্ত হয়
   
✅ STEP 6: Tax reversal
   - Audit trail এ নথিভুক্ত হয়
   
✅ STEP 7: Comprehensive audit trail
   - সব অ্যাকশন ডকুমেন্ট করা হয়
```

### 2. **Sales List Filtering** ✅
**ফাইল:** [convex/sales.ts](convex/sales.ts#L5-L30)

✅ Sales list থেকে exclude করা হয়:
```typescript
filter(sale => sale.status !== "returned" && sale.status !== "cancelled")
```

### 3. **TypeScript Compilation** ✅
```
✅ 0 errors found
✅ All imports correct
✅ All database fields valid
✅ All mutations have correct signatures
```

---

## স্টেপ-বাই-স্টেপ টেস্টিং ইন্সট্রাকশন

### **ধাপ ১: প্রয়োজনীয় সেলস খুঁজে বের করুন**

1. অ্যাপ খুলুন
2. "Sales List" / "বিক্রয় তালিকা" যান
3. **নিচের দিক থেকে একটি সেলস নির্বাচন করুন** (যেটি পুরনো)
4. সেলস ডিটেইলস নোট করুন:
   - Sale Number: ____________
   - Customer Name: ____________
   - Total Amount: ____________
   - Items: ____________
   - Loyalty Points earned: ____________

### **ধাপ ২: রিফান্ড তৈরি করুন**

1. "Refund Management" / "রিফান্ড ব্যবস্থাপনা" যান
2. "New Refund" / "নতুন রিফান্ড" ক্লিক করুন
3. উপরের সেল সিলেক্ট করুন
4. সব আইটেম রিটার্ন করার জন্য চেক করুন
5. Refund Reason: "Testing Undo Sale"
6. Return Condition: "Good"
7. **"Create Refund"** ক্লিক করুন

### **ধাপ ৩: রিফান্ড অনুমোদন করুন**

1. রিফান্ড তালিকায় খুঁজে পান
2. Status দেখুন: "pending_approval"
3. **"Approve"** বাটন ক্লিক করুন
4. Status দেখুন: "approved"

### **ধাপ ৪: রিফান্ড প্রসেস করুন**

1. রিফান্ড খুলুন
2. Status: "approved"
3. **"Process"** বাটন ক্লিক করুন
4. Status হবে: "processed"

### **ধাপ ৫: রিফান্ড সম্পন্ন করুন (Undo Sale)**

1. রিফান্ড খুলুন (status = "processed")
2. Return Condition: "Good" সিলেক্ট করুন
3. Inspection Notes: "Test verification"
4. **"Complete Refund"** ক্লিক করুন ✅

---

## ভেরিফিকেশন চেকলিস্ট

### ✅ **Verification Point 1: Sale Status Changed**

**যা দেখা উচিত:**
```
✅ Sale status পরিবর্তন হয়েছে "cancelled" এ
```

**কিভাবে চেক করবেন:**
1. Sales List খুলুন
2. ফিল্টার: "Show All Sales" / "সব সেলস দেখান"
3. আমাদের সেল অনুসন্ধান করুন
4. Status দেখুন: **"cancelled"**

---

### ✅ **Verification Point 2: Sale Removed from Sales List**

**যা দেখা উচিত:**
```
❌ Sale আর "active sales" তে দেখা যাবে না
✅ শুধুমাত্র "cancelled" সেলস ফিল্টার সহ দেখা যাবে
```

**কিভাবে চেক করবেন:**
1. Sales List খুলুন (default view)
2. আমাদের সেল **দেখা যাবে না**
3. ফিল্টার করুন: "Include Cancelled"
4. এখন **দেখা যাবে**

---

### ✅ **Verification Point 3: Inventory Restored**

**যা দেখা উচিত:**
```
✅ Product stock increased
✅ Stock movements created
```

**কিভাবে চেক করবেন:**
1. "Inventory" / "ইনভেন্টরি" খুলুন
2. রিফান্ড করা প্রোডাক্ট খুঁজুন
3. Stock quantity দেখুন - **বৃদ্ধি পেয়েছে**
4. "Stock Movements" রিপোর্ট দেখুন
5. খুঁজুন: Reason = "Undo Sale Return"
6. Reference = আমাদের Refund Number

**Expected Data:**
```
Product: [Product Name]
Previous Stock: X
Movement: +[Quantity] (type: "in")
New Stock: X + [Quantity]
Reason: "Undo Sale Return"
Reference: REF-2024-XXXX
```

---

### ✅ **Verification Point 4: Loyalty Points Reversed**

**যা দেখা উচিত:**
```
✅ Customer loyalty points হ্রাস পেয়েছে
✅ Points transaction created (type: "refund")
```

**কিভাবে চেক করবেন:**
1. Customers খুলুন
2. রিফান্ড কাস্টমার খুঁজুন
3. Loyalty Points তুলনা করুন:
   - **পূর্ব:** [Original Points]
   - **বর্তমান:** [Original - Earned Points] ✅

**Optional - Points Transactions দেখুন:**
1. Customer profile খুলুন
2. "Loyalty History" / "লয়্যালটি ইতিহাস" দেখুন
3. খুঁজুন: `transactionType = "refund"`
4. উদাহরণ:
```
- Type: "purchase" | +50 points | (From original sale)
- Type: "refund" | -50 points | (Just created - reversal)
```

---

### ✅ **Verification Point 5: Payment Reversal Documented**

**যা দেখা উচিত:**
```
✅ Audit trail shows payment reversal
✅ Amount matches original payment
```

**কিভাবে চেক করবেন:**
1. Refund খুলুন
2. "View Audit Trail" / "অডিট ট্রেইল দেখুন" ক্লিক করুন
3. খুঁজুন: "UNDO SALE COMPLETED"
4. নিচের তথ্য ভেরিফাই করুন:

```
✅ Original sale #[Number] marked as cancelled
✅ Payment of $[Amount] reversed
✅ [X] items restored to inventory
✅ [Y] loyalty points reversed
```

---

### ✅ **Verification Point 6: Comprehensive Audit Trail**

**যা দেখা উচিত:**
```
✅ Complete audit trail entry
✅ All reversals documented with amounts
✅ User info and timestamp recorded
```

**নমুনা Audit Trail Entry:**
```json
{
  "refundId": "...",
  "refundNumber": "REF-2024-XXXX",
  "actionType": "completed",
  "previousStatus": "processed",
  "newStatus": "completed",
  "performedBy": "[User ID]",
  "performedByName": "[User Name]",
  "timestamp": "2024-01-31 14:30:00",
  "notes": "✅ UNDO SALE COMPLETED - All transactions reversed. Original sale #SAL-2024-001 marked as cancelled. Payment reversed (5000). Stock restored (2 items). Loyalty points reversed. Return condition: Good"
}
```

---

## সম্ভাব্য সমস্যা এবং সমাধান

### ⚠️ **সমস্যা 1: Sale এখনও Sales List এ দেখা যাচ্ছে**

**কারণ:** Page refresh হয়নি বা ফিল্টার আপডেট হয়নি

**সমাধান:**
1. Page সম্পূর্ণভাবে রিফ্রেশ করুন (F5)
2. Sales List এ ফিল্টার চেক করুন
3. নিশ্চিত করুন "Show Cancelled" OFF আছে

---

### ⚠️ **সমস্যা 2: Inventory স্টক আপডেট হয়নি**

**কারণ:** Restock Required চেক করা হয়নি, বা stock movement কাজ করছে না

**সমাধান:**
1. Refund এ "Restock Required" চেক করুন
2. Stock Movements টেবিলে খুঁজুন
3. Database ডাইরেক্টলি চেক করুন (Convex Dashboard)

---

### ⚠️ **সমস্যা 3: Loyalty পয়েন্টস রিভার্স হয়নি**

**কারণ:** গ্রাহক এর কোন পয়েন্টস ছিল না, অথবা পয়েন্টস ট্রানজ্যাকশন লিঙ্ক ছিল না

**সমাধান:**
1. নিশ্চিত করুন গ্রাহক এর কাছে পয়েন্টস আছে
2. চেক করুন `pointsTransactions` টেবিল এ `referenceId = saleId`
3. ম্যানুয়ালি পয়েন্টস রিভার্স করুন যদি লিঙ্ক না থাকে

---

## স্বয়ংক্রিয় যাচাইকরণ

Convex Dashboard এ নিম্নলিখিত কোয়েরি চালান:

### **Query 1: Sale Status Check**
```
db.collection("sales").find({ saleNumber: "SAL-2024-XXXX" })
```

**Expected Result:**
```json
{
  "status": "cancelled",
  "saleNumber": "SAL-2024-XXXX",
  ...
}
```

---

### **Query 2: Stock Movements Check**
```
db.collection("stockMovements").find({ 
  reference: "REF-2024-XXXX",
  type: "in"
})
```

**Expected Result:**
```json
[
  {
    "type": "in",
    "reason": "Undo Sale Return",
    "quantity": 2,
    "reference": "REF-2024-XXXX"
  }
]
```

---

### **Query 3: Loyalty Points Transaction**
```
db.collection("pointsTransactions").find({
  referenceId: "[SALE_ID]",
  transactionType: "refund"
})
```

**Expected Result:**
```json
[
  {
    "transactionType": "refund",
    "points": -50,
    "description": "Points reversal for sale #SAL-2024-XXX..."
  }
]
```

---

### **Query 4: Audit Trail Check**
```
db.collection("refundAuditTrail").find({
  refundId: "[REFUND_ID]",
  actionType: "completed"
})
```

**Expected Result:**
```json
{
  "actionType": "completed",
  "newStatus": "completed",
  "notes": "✅ UNDO SALE COMPLETED - All transactions reversed..."
}
```

---

## সফলতা মানদণ্ড

সব কিছু ঠিক আছে যদি:

- ✅ Sale status = "cancelled"
- ✅ Sale আর সক্রিয় sales তে দৃশ্যমান নয়
- ✅ Product stock বৃদ্ধি পেয়েছে
- ✅ Stock movements তৈরি হয়েছে
- ✅ Customer loyalty points হ্রাস পেয়েছে
- ✅ Points transaction রেকর্ড করা হয়েছে
- ✅ Audit trail সম্পূর্ণ এবং বিস্তারিত
- ✅ Payment reversal ডকুমেন্ট করা হয়েছে

**যদি সব ✅ থাকে, তাহলে Undo Sale সম্পূর্ণভাবে কাজ করছে!** 🎉

---

## পরবর্তী ধাপ

1. সব ভেরিফিকেশন পয়েন্ট চেক করুন
2. যদি কোনো সমস্যা থাকে, নোট করুন
3. ডাটাবেস কোয়েরি চালান যাচাইকরণের জন্য
4. সবকিছু ঠিক হলে, উৎপাদনে স্থাপন করুন

---

## যোগাযোগ

যদি কোনো সমস্যা হয় অথবা কিছু কাজ না করে, তাহলে:
1. এই চেকলিস্ট অনুসরণ করুন
2. সঠিক টেবিল এবং ফিল্ড নাম ভেরিফাই করুন
3. Convex Dashboard এ ডাটা ম্যানুয়ালি চেক করুন
