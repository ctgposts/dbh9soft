# 🚀 অটোমেটেড রিফান্ড প্রক্রিয়া - দ্রুত গাইড

**স্ট্যাটাস:** ✅ তিনটি নতুন automated mutation যোগ করা হয়েছে

---

## 🎯 আপনার বিক্রয়:
- `INV-1769778062695`
- `INV-1769776643529`

---

## 📋 কী করতে হবে (Convex Functions ট্যাবে)

### STEP 1: রিফান্ড তৈরি করুন + অনুমোদন করুন

**Function:** `refunds.createAndApproveBulk`

**Arguments পেস্ট করুন:**
```json
{
  "saleNumbers": [
    "INV-1769778062695",
    "INV-1769776643529"
  ],
  "autoApprove": true
}
```

✅ **Call Function** ক্লিক করুন

**প্রত্যাশিত ফলাফল:**
```json
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "results": [
    {
      "saleNumber": "INV-1769778062695",
      "refundId": "...",
      "refundNumber": "REF-1769778062695-AUTO",
      "amount": 100,
      "status": "created_and_approved"
    },
    {
      "saleNumber": "INV-1769776643529",
      "refundId": "...",
      "refundNumber": "REF-1769776643529-AUTO",
      "amount": 100,
      "status": "created_and_approved"
    }
  ],
  "nextSteps": "Now run refunds.processBulk() to process payments"
}
```

📝 **নোট করুন:**
- Refund ID #1: _________________
- Refund ID #2: _________________

---

### STEP 2: রিফান্ড প্রসেস করুন

**Function:** `refunds.processBulk`

**Arguments পেস্ট করুন** (উপরের Refund IDs ব্যবহার করুন):
```json
{
  "refundIds": [
    "REFUND_ID_1_HERE",
    "REFUND_ID_2_HERE"
  ]
}
```

✅ **Call Function** ক্লিক করুন

**প্রত্যাশিত ফলাফল:**
```json
{
  "success": true,
  "processed": 2,
  "results": [...],
  "nextSteps": "Now run refunds.completeBulk() to complete refunds and trigger Undo Sale"
}
```

---

### STEP 3: রিফান্ড সম্পন্ন করুন (UNDO SALE)

> ⚠️ **এটি সবকিছু সক্রিয় করে** — স্টক, লয়্যালটি, বিক্রয় cancellation

**Function:** `refunds.completeBulk`

**Arguments পেস্ট করুন:**
```json
{
  "refundIds": [
    "REFUND_ID_1_HERE",
    "REFUND_ID_2_HERE"
  ],
  "returnCondition": "Full Refund Completed"
}
```

✅ **Call Function** ক্লিক করুন

**প্রত্যাশিত ফলাফল:**
```json
{
  "success": true,
  "completed": 2,
  "results": [
    {
      "refundId": "...",
      "refundNumber": "REF-1769778062695-AUTO",
      "saleNumber": "INV-1769778062695",
      "status": "completed"
    },
    {
      "refundId": "...",
      "refundNumber": "REF-1769776643529-AUTO",
      "saleNumber": "INV-1769776643529",
      "status": "completed"
    }
  ],
  "summary": "✅ Undo Sale complete for 2 sales. All inventory restored, loyalty points reversed."
}
```

---

## ✅ যাচাইকরণ (সব সম্পন্ন করার পরে)

**Convex Data ট্যাবে:**

1. **refunds টেবিল:**
   - [ ] `REF-1769778062695-AUTO` → status = "completed"
   - [ ] `REF-1769776643529-AUTO` → status = "completed"

2. **sales টেবিল:**
   - [ ] `INV-1769778062695` → status = "cancelled"
   - [ ] `INV-1769776643529` → status = "cancelled"

3. **products টেবিল:**
   - [ ] Refund করা পণ্য stock বৃদ্ধি পেয়েছে

4. **refundAuditTrail টেবিল:**
   - [ ] ৬টি রেকর্ড (প্রতি refund = 3 action)
     - created
     - approved
     - processed
     - completed
     - discount_reversal (if any)
     - tax_reversal (if any)

---

## 🎉 সম্পূর্ণ!

যখন সব ✅:
- ✅ দুটি বিক্রয় cancelled
- ✅ পূর্ণ অর্থ রিফান্ড
- ✅ স্টক পুনরুদ্ধার
- ✅ লয়্যালটি পয়েন্ট বিপরীত
- ✅ সম্পূর্ণ অডিট ট্রেইল

---

**এখনই শুরু করুন! Convex Dashboard খুলুন এবং STEP 1 চালান। 🚀**

