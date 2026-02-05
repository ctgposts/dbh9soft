# পেজ ডিজাইন রিফাকটরিং সম্পূর্ণ গাইড

## সব পেজের জন্য সামঞ্জস্যপূর্ণ কাঠামো

### পেজ লেআউট টেমপ্লেট

```tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";

export function PageName() {
  // ===== DATA =====
  const data = useQuery(api.data.list, {}) || [];
  
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState("");
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* HEADER - সাইডবার থেকে আলাদা */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Page Title</h1>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Search/Filter Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Data Section */}
          <div className="space-y-4">
            {/* List/Table Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Data List</h2>
                <div className="space-y-2">
                  {/* Items */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## ডিজাইন নীতি

### 1. কালার থিম
```
Background: 
- হালকা স্লেট ৫০ থেকে সাদায় gradient
- হেডার: সাদা ব্যাকগ্রাউন্ড

Cards:
- সাদা (#ffffff)
- বর্ডার: slate-200
- হভার বর্ডার: slate-300
- হভার ছায়া: shadow-md

Text:
- প্রধান: slate-900
- সহায়ক: slate-600
- লেবেল: slate-500
- প্লেসহোল্ডার: slate-400

Accents:
- Primary: purple-600/purple-700
- Success: green-600
- Warning: yellow-600
- Error: red-600
```

### 2. টাইপোগ্রাফি
```
Page Title:     text-2xl font-bold text-slate-900
Section Title:  text-lg font-bold text-slate-900
Card Title:     text-base font-semibold text-slate-900
Body Text:      text-sm text-slate-600/700
Label:          text-xs font-semibold uppercase tracking-wider text-slate-500
Helper:         text-xs text-slate-500
```

### 3. স্পেসিং
```
Page Padding:   py-8 md:py-12
Container:      px-4 sm:px-6 lg:px-8 max-w-7xl
Card Padding:   p-5 sm:p-6
Section Gap:    space-y-6 / space-y-8
Item Gap:       space-y-2 / space-y-3
Grid Gap:       gap-4 sm:gap-6
```

### 4. কম্পোনেন্ট
```
কার্ড:
  bg-white rounded-xl border border-slate-200 
  hover:border-slate-300 hover:shadow-md transition-all
  p-5 sm:p-6

বোতাম (প্রাথমিক):
  px-4 py-2 bg-purple-600 text-white rounded-lg 
  hover:bg-purple-700 transition-colors font-semibold

বোতাম (সেকেন্ডারি):
  px-4 py-2 bg-slate-100 text-slate-900 rounded-lg 
  hover:bg-slate-200 transition-colors font-semibold

ইনপুট:
  w-full px-4 py-2 border border-slate-300 rounded-lg 
  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent

ব্যাজ:
  px-3 py-1 rounded-full bg-slate-100 text-slate-700 
  text-xs font-semibold
```

## সব পেজের জন্য সাধারণ কাঠামো

### 1. Dashboard ✅ (সম্পূর্ণ)
- মেট্রিক্স প্রথম (৪ + ৪ কার্ড)
- বিক্রয় এবং শীর্ষ পণ্য
- সতর্কতা এবং কার্যকলাপ

### 2. Inventory (পরবর্তী)
- শিরোনাম: "Inventory Management"
- ফিল্টার সেকশন
- পণ্য তালিকা (টেবিল বা কার্ড)
- সংক্ষিপ্ত পরিসংখ্যান

### 3. Sales
- বিক্রয় মেট্রিক্স
- শীর্ষ পণ্য
- বিক্রয় তালিকা
- রূপান্তর চার্ট

### 4. Customers
- গ্রাহক মেট্রিক্স
- অনুসন্ধান এবং ফিল্টার
- গ্রাহক তালিকা
- আনুগত্য তথ্য

### 5. Categories
- বিভাগ মেট্রিক্স
- বিভাগ তালিকা
- গ্রিড লেআউট

### 6. Settings
- সেটিংস বিভাগ
- ফর্ম গ্রুপ
- সংরক্ষণ বোতাম

### 7. Reports
- রিপোর্ট মেট্রিক্স
- ফিল্টার
- চার্ট এবং গ্রাফ
- ডেটা টেবিল

### 8. POS
- বিক্রয় স্ক্রীন
- পণ্য সংযোজন
- কার্ট
- চেকআউট

## রঙ প্যালেট রেফারেন্স

```
Primary:    purple-600   (#9333ea)
Info:       blue-600     (#2563eb)
Success:    green-600    (#16a34a)
Warning:    yellow-600   (#ca8a04)
Error:      red-600      (#dc2626)

Background:
- bg-white                (#ffffff)
- bg-slate-50            (#f8fafc)
- bg-slate-100           (#f1f5f9)

Border:
- border-slate-200       (#e2e8f0)
- border-slate-300       (#cbd5e1)

Text:
- text-slate-900         (#0f172a)
- text-slate-600         (#475569)
- text-slate-500         (#64748b)
- text-slate-400         (#94a3b8)
```

## হোভার এবং ইন্টারঅ্যাকশন

```
কার্ড হভার:
  hover:border-slate-300 hover:shadow-md transition-all duration-300

বোতাম হভার:
  hover:bg-purple-700 transition-colors duration-200

ইনপুট ফোকাস:
  focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none
```

## পেজ পরিকল্পনা (অগ্রাধিকার)

1. **Dashboard** ✅ - সম্পূর্ণ আপডেট
2. **Inventory** - পরবর্তী (বড় পেজ)
3. **Sales** - প্রধান ডেটা পেজ
4. **Customers** - গ্রাহক তালিকা
5. **Settings** - ফর্ম এবং ইনপুট
6. **Reports** - ডেটা ভিজ্যুয়ালাইজেশন
7. **POS** - বিশেষ লেআউট
8. **বাকি পেজ** - অনুসরণ করুন একই নীতি

প্রতিটি পেজ এই ডিজাইন সিস্টেম অনুসরণ করবে সাধারণত এবং নির্দিষ্ট কার্যকারিতা অনুযায়ী কাস্টমাইজ করা হবে।
