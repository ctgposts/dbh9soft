# 🚀 দ্রুত শুরু - ডিজাইন গাইড

## নতুন পেজ তৈরি করার সময়

### স্টেপ 1: পেজ কাঠামো
```tsx
import { useState } from "react";

export function PageName() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Title</h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Content here */}
        </div>
      </div>
    </div>
  );
}
```

### স্টেপ 2: কার্ড কম্পোনেন্ট
```tsx
<div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
  <h3 className="text-lg font-bold text-slate-900 mb-4">Card Title</h3>
  {/* Content */}
</div>
```

### স্টেপ 3: মেট্রিক কার্ড
```tsx
<div className="bg-white rounded-xl border border-slate-200 p-6">
  <div className="flex items-start justify-between mb-4">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Label</p>
      <p className="text-4xl font-bold text-slate-900">Number</p>
    </div>
    <div className="w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-xl">Icon</div>
  </div>
  <p className="text-sm text-slate-600">Helper text</p>
</div>
```

---

## দ্রুত রেফারেন্স

### কালার ক্লাস
```
Primary:    bg-purple-600, text-purple-600, border-purple-600
Blue:       bg-blue-100, text-blue-700, border-blue-200
Green:      bg-green-100, text-green-700, border-green-200
Yellow:     bg-yellow-100, text-yellow-700, border-yellow-200
Red:        bg-red-100, text-red-700, border-red-200

Default:    bg-white, border-slate-200, text-slate-900
Hover:      border-slate-300, shadow-md
```

### টেক্সট ক্লাস
```
শিরোনাম:     text-2xl font-bold text-slate-900
সাবটাইটেল: text-lg font-bold text-slate-900
বডি:         text-sm text-slate-700
ছোট:        text-xs text-slate-600
লেবেল:      text-xs font-semibold uppercase text-slate-500
```

### স্পেসিং ক্লাস
```
মার্জিন:     my-4, mx-4
প্যাডিং:    p-6, px-4, py-3
গ্যাপ:       gap-4, gap-6
স্পেস:      space-y-2, space-y-4, space-y-6
```

---

## বোতাম ভ্যারিয়েশন

### প্রাথমিক বোতাম
```tsx
className="px-4 py-2 bg-purple-600 text-white rounded-lg 
           hover:bg-purple-700 font-semibold transition-colors"
```

### সেকেন্ডারি বোতাম
```tsx
className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg 
           hover:bg-slate-200 font-semibold transition-colors"
```

### ডেঞ্জার বোতাম
```tsx
className="px-4 py-2 bg-red-600 text-white rounded-lg 
           hover:bg-red-700 font-semibold transition-colors"
```

---

## ইনপুট স্টাইল
```tsx
className="w-full px-4 py-2 border border-slate-300 rounded-lg 
           focus:outline-none focus:ring-2 focus:ring-purple-500 
           focus:border-transparent"
```

---

## গ্রিড লেআউট

### ৪ কলাম (মেট্রিক্স)
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
```

### ২ কলাম (সেকশন)
```tsx
className="grid grid-cols-1 lg:grid-cols-2 gap-6"
```

### তালিকা
```tsx
<div className="space-y-2">
  {items.map(item => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100">
      {/* Item content */}
    </div>
  ))}
</div>
```

---

## অ্যানিমেশন

### হভার ট্রানজিশন
```tsx
className="hover:border-slate-300 hover:shadow-md transition-all duration-300"
```

### দ্রুত ট্রানজিশন
```tsx
className="transition-all duration-200"
```

### ধীর ট্রানজিশন
```tsx
className="transition-all duration-500"
```

---

## টিপস এবং ট্রিকস

✅ **সবসময় ব্যবহার করুন:**
- `bg-gradient-to-b from-slate-50 via-white to-slate-50` পেজ ব্যাকগ্রাউন্ড
- `sticky top-0 z-40` হেডারের জন্য
- `mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl` কন্টেইনার
- `rounded-xl` কার্ড কোণ
- `transition-all` সব ইন্টারঅ্যাকশনের জন্য

❌ **এড়িয়ে চলুন:**
- বিভিন্ন পটভূমি রঙ (শুধু slate/white)
- অত্যধিক গ্র্যাডিয়েন্ট বা প্রভাব
- অসামঞ্জস্যপূর্ণ স্পেসিং
- হার্ড শ্যাডো বা বর্ডার
- একাধিক প্রাথমিক রঙ

---

## ডিজাইন চেকলিস্ট

পেজ সম্পূর্ণ করার সময়:

- [ ] সামঞ্জস্যপূর্ণ ব্যাকগ্রাউন্ড gradient ব্যবহার করা হয়েছে
- [ ] হেডার sticky এবং white
- [ ] সব কার্ড white + border-slate-200
- [ ] সব টেক্সট slate-900 (প্রধান) বা slate-600 (সহায়ক)
- [ ] স্পেসিং সামঞ্জস্যপূর্ণ (gap-4 sm:gap-6)
- [ ] বোতাম হভার ইফেক্ট আছে
- [ ] প্রতিক্রিয়াশীল (mobile/tablet/desktop)
- [ ] কোন ত্রুটি নেই বিল্ডে

---

## আরও সাহায্যের জন্য

দেখুন:
- `MODERN_DESIGN_SYSTEM.md` - সম্পূর্ণ গাইড
- `PAGE_REDESIGN_GUIDE.md` - পেজ টেমপ্লেট
- `Dashboard.tsx` - সম্পূর্ণ উদাহরণ
