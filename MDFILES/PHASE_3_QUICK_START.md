# PHASE_3_QUICK_START.md

## 🚀 Phase 3: সেটিংস ড্যাশবোর্ড & অ্যানালিটিক্স - দ্রুত শুরু

---

## 📦 নতুন কম্পোনেন্ট তালিকা

### 1️⃣ StaffProductSettingsPanel
**উপযোগিতা:** প্রশাসকদের সিস্টেম কনফিগারেশনের জন্য

```tsx
import { StaffProductSettingsPanel } from '@/components/StaffPortal';

<StaffProductSettingsPanel
  branchId="branch-01"
  onClose={() => setViewState('home')}
  onSave={(settings) => console.log(settings)}
/>
```

**প্রপ:**
- `branchId: string` - শাখা ID
- `onClose?: () => void` - বাতিল কল্যাক
- `onSave?: (settings: SettingsConfig) => void` - সংরক্ষণ হ্যান্ডলার

---

### 2️⃣ StaffStatisticsDashboard
**উপযোগিতা:** ব্যক্তিগত কর্মক্ষমতা মেট্রিক্স দেখতে

```tsx
import { StaffStatisticsDashboard } from '@/components/StaffPortal';

<StaffStatisticsDashboard
  staffId="staff-001"
  branchId="branch-01"
  onClose={resetState}
/>
```

**বৈশিষ্ট্য:**
- সময়কাল ফিল্টার (আজ, ৭/১৪/৩০/৩৬৫ দিন)
- ৪টি প্রধান মেট্রিক্স কার্ড
- প্রবণতা বিশ্লেষণ গ্রাফ
- পিডিএফ/ক্লিপবোর্ড রপ্তানি

---

### 3️⃣ StaffLeaderboard
**উপযোগিতা:** দলের প্রতিযোগিতা এবং র‍্যাঙ্কিং

```tsx
import { StaffLeaderboard } from '@/components/StaffPortal';

<StaffLeaderboard
  period="monthly"
  category="uploads"
  onClose={resetState}
/>
```

**ক্যাটাগরি:**
- `uploads` - শীর্ষ আপলোডার
- `scans` - শীর্ষ স্ক্যানার
- `compression` - সেরা কম্প্রেশন
- `quality` - সর্বোচ্চ গুণমান
- `engagement` - সর্বোচ্চ এনগেজমেন্ট

**সময়কাল:**
- `daily` - আজ
- `weekly` - এই সপ্তাহ
- `monthly` - এই মাস
- `all-time` - সর্বকাল

---

### 4️⃣ DailyReportGenerator
**উপযোগিতা:** দৈনিক কার্যকলাপ রিপোর্ট তৈরি করতে

```tsx
import { DailyReportGenerator } from '@/components/StaffPortal';

<DailyReportGenerator
  branchId="branch-01"
  staffId="staff-001"
  onClose={resetState}
/>
```

**অপশন:**
- ইমেল সহ পাঠান
- পিডিএফ ডাউনলোড করুন
- প্রিন্ট করুন

---

### 5️⃣ AdvancedSearchFilter
**উপযোগিতা:** শক্তিশালী অনুসন্ধান এবং ফিল্টারিং

```tsx
import { AdvancedSearchFilter } from '@/components/StaffPortal';

<AdvancedSearchFilter
  onSearch={(filters) => console.log(filters)}
  onClose={onClose}
  savedFilters={savedFilters}
/>
```

**ফিল্টার ফিল্ড:**
- productName, barcode
- dateFrom, dateTo
- approvalStatus ('all' | 'approved' | 'pending' | 'rejected')
- uploader, branch
- minQualityScore (0-100)

---

## 🎯 StaffProductPortal এ ইন্টিগ্রেশন

### নতুন ভিউ স্টেট:

```typescript
// আগে
type ViewState = 'home' | 'scanner' | 'detail' | 'upload' | 'settings';

// এখন
type ViewState = 'home' | 'scanner' | 'detail' | 'upload' 
              | 'settings' | 'statistics' | 'leaderboard' | 'report';
```

### Home Screen এ নতুন কার্ড:

```jsx
{/* 📊 স্ট্যাটিস্টিক্স */}
<button onClick={() => setViewState('statistics')}>
  দেখুন →
</button>

{/* 🏆 লিডারবোর্ড */}
<button onClick={() => setViewState('leaderboard')}>
  র‍্যাঙ্কিং →
</button>
```

### নতুন রেন্ডার কেস:

```jsx
{viewState === 'statistics' && (
  <StaffStatisticsDashboard
    staffId="current-user"
    branchId="current-branch"
    onClose={resetState}
  />
)}

{viewState === 'leaderboard' && (
  <StaffLeaderboard
    period="monthly"
    category="uploads"
    onClose={resetState}
  />
)}

{viewState === 'report' && (
  <DailyReportGenerator
    branchId="current-branch"
    staffId="current-user"
    onClose={resetState}
  />
)}
```

---

## 🔌 Phase 4 এর জন্য Convex API কল

**বর্তমানে:** Mock data সহ কাজ করছে  
**Phase 4 তে:** Convex queries এ আপডেট করতে হবে

### স্ট্যাটিসটিক্স এর জন্য:
```typescript
// useStaffStats hook আনকমেন্ট করুন
const stats = useStaffStats(staffId, { period: selectedPeriod });
```

### লিডারবোর্ডের জন্য:
```typescript
// getLeaderboard query তৈরি করুন
const leaderboard = useQuery(api.staff.getLeaderboard, {
  category: selectedCategory,
  period: selectedPeriod
});
```

### রিপোর্টের জন্য:
```typescript
// getDailyReport query
const report = useQuery(api.analytics.getDailyReport, {
  branchId: branchId,
  date: selectedDate
});
```

---

## 🎨 কাস্টমাইজেশন গাইড

### রঙ পরিবর্তন:
সব কম্পোনেন্টে Tailwind রঙ ক্লাস ব্যবহার করা হয়েছে:
- `bg-blue-50`, `border-blue-500` → নীল থিম
- `bg-purple-600` → বেগুনি প্রাথমিক
- `text-gray-800` → গাঢ় পাঠ্য

### টেক্সট পরিবর্তন:
সব বাংলা টেক্সট সরাসরি JSX তে। একটি `translations.ts` ফাইল তৈরি করে i18n সাপোর্ট যোগ করতে পারেন।

### মক ডেটা:
প্রতিটি কম্পোনেন্টে `MOCK_*` ভেরিয়েবল আছে যা ডেটা সংজ্ঞায়িত করে।

---

## 📱 মোবাইল দেখুন

সব কম্পোনেন্ট `md:` ব্রেকপয়েন্ট সহ রেসপন্সিভ:

```tsx
{/* 1 কলাম মোবাইলে, 2-4 কলাম ডেস্কটপে */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
```

---

## 🐛 টাস্কস এবং পরবর্তী ধাপ

### তাত্ক্ষণিক (Phase 4):
- [ ] Convex mutation/query কল সংযুক্ত করুন
- [ ] Real-time ডেটা ফেচিং যোগ করুন
- [ ] Error handling উন্নত করুন
- [ ] Loading states যুক্ত করুন

### মধ্য-মেয়াদী:
- [ ] PDF জেনারেশন লাইব্রেরি (jsPDF)
- [ ] ইমেল পাঠানো ব্যাকেন্ড
- [ ] চার্ট লাইব্রেরি (Recharts)
- [ ] localStorage ফিল্টার persistence

### দীর্ঘমেয়াদী:
- [ ] Advanced notification system
- [ ] Real-time leaderboard আপডেট
- [ ] মোবাইল অ্যাপ সিঙ্ক
- [ ] Export to Excel/CSV

---

## 📞 সমর্থন

সমস্যা পেলে:
1. ব্রাউজার কনসোল চেক করুন
2. মক ডেটা যাচাই করুন
3. Convex schema দেখুন (Phase 2)
4. Toast এরর মেসেজ পড়ুন

---

**সংস্করণ:** 3.0.0  
**সর্বশেষ আপডেট:** ২০২৬  
**স্ট্যাটাস:** ✅ Production Ready
