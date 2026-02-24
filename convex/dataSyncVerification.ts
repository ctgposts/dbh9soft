// Data Sync Verification Script
// এই ফাইলটি সমস্ত ডেটা সিঙ্ক পয়েন্ট যাচাই করে

export interface DataSyncCheckpoint {
  name: string;
  description: string;
  fields: string[];
  relatedTables: string[];
  expectedBehavior: string;
}

const DataSyncCheckpoints: DataSyncCheckpoint[] = [
  // ========== প্রোডাক্ট আপডেট ==========
  {
    name: "Product Price Update",
    description: "প্রোডাক্টের মূল্য আপডেট করা হলে সব জায়গায় প্রতিফলিত হয় কিনা",
    fields: ["costPrice", "sellingPrice"],
    relatedTables: ["products", "dashboard", "reports", "stockManagement"],
    expectedBehavior: `
      1. costPrice পরিবর্তিত হলে:
         - products.costPrice আপডেট হয়
         - dashboard.totalInventoryValue পুনরায় গণনা হয় (costPrice × currentStock)
         - reports স্টক ভ্যালু আপডেট হয়
      
      2. sellingPrice পরিবর্তিত হলে:
         - products.sellingPrice আপডেট হয়
         - রিপোর্ট মার্জিন পুনরায় গণনা হয়
         - স্টক ভ্যালু রিপোর্ট আপডেট হয়
    `
  },

  {
    name: "Stock Level Update",
    description: "প্রোডাক্টের মিন/ম্যাক্স স্টক লেভেল আপডেট করা হলে সব শাখায় আপডেট হয় কিনা",
    fields: ["minStockLevel", "maxStockLevel"],
    relatedTables: ["products", "stockManagement", "branches"],
    expectedBehavior: `
      1. minStockLevel বা maxStockLevel পরিবর্তিত হলে:
         - products.minStockLevel এবং maxStockLevel গ্লোবালি আপডেট হয়
         - প্রতিটি branchStock এন্ট্রিতে minStockLevel এবং maxStockLevel আপডেট হয়
         - কম স্টক সতর্কতা সঠিকভাবে ট্রিগার হয়
         - স্টক ম্যানেজমেন্ট সঠিক লেভেল দেখায়
    `
  },

  // ========== বিক্রয় লেনদেন ==========
  {
    name: "Sale Stock Deduction",
    description: "একটি বিক্রয় করা হলে স্টক সঠিকভাবে হ্রাস পায় কিনা",
    fields: ["currentStock", "branchStock", "saleNumber"],
    relatedTables: ["products", "sales", "stockMovements"],
    expectedBehavior: `
      একটি বিক্রয় তৈরি হলে:
      1. products.currentStock (গ্লোবাল) কমে যায়
      2. products.branchStock[i].currentStock (শাখা-নির্দিষ্ট) কমে যায়
      3. stockMovements টেবিলে লেনদেন লগ হয়
      4. ড্যাশবোর্ডে স্টক আপডেট হয়
      5. কাস্টমার পারচেজ হিস্টরি আপডেট হয়
    `
  },

  // ========== স্টক সামঞ্জস্য ==========
  {
    name: "Stock Adjustment",
    description: "স্টক ম্যানুয়ালি সামঞ্জস্য করা হলে সব স্থানে আপডেট হয় কিনা",
    fields: ["currentStock", "branchStock"],
    relatedTables: ["products", "stockMovements"],
    expectedBehavior: `
      স্টক সামঞ্জস্য করা হলে:
      1. products.currentStock নতুন মানে সেট হয়
      2. ডিফল্ট branchStock এন্ট্রিও আপডেট হয়
      3. stockMovements লগে রেকর্ড করা হয়
      4. ড্যাশবোর্ড তাৎক্ষণিকভাবে আপডেট হয়
    `
  },

  // ========== স্টক ট্রান্সফার ==========
  {
    name: "Stock Transfer",
    description: "শাখা থেকে শাখায় স্টক স্থানান্তর সঠিকভাবে কাজ করে কিনা",
    fields: ["branchStock", "currentStock"],
    relatedTables: ["products", "stockTransfer", "inventoryTransactions"],
    expectedBehavior: `
      স্টক ট্রান্সফার শিপ করা হলে:
      1. উৎস শাখার branchStock[sourceId].currentStock কমে যায়
      2. গন্তব্য শাখার branchStock[destId].currentStock বৃদ্ধি পায়
      3. গ্লোবাল currentStock অপরিবর্তিত থাকে
      4. inventoryTransactions লগে রেকর্ড করা হয়
    `
  },

  // ========== ড্যাশবোর্ড গণনা ==========
  {
    name: "Dashboard Calculations",
    description: "ড্যাশবোর্ড সঠিকভাবে সব মেট্রিক্স গণনা করে কিনা",
    fields: ["totalInventoryValue", "lowStockCount", "totalAbayas"],
    relatedTables: ["products", "sales", "dashboard"],
    expectedBehavior: `
      ড্যাশবোর্ড প্রতিটি বার রিয়েল-টাইম কোয়েরি করে:
      1. totalInventoryValue = Σ(costPrice × currentStock)
      2. lowStockCount = গণনা যেখানে currentStock ≤ minStockLevel
      3. totalAbayas = Σ(currentStock) সক্রিয় প্রোডাক্টের
      4. বিক্রয় ফিল্টারিং সঠিক সময়কাল দেখায়
    `
  },

  // ========== ইনভেন্টরি এডিট ==========
  {
    name: "Product Edit Form",
    description: "প্রোডাক্ট এডিট করার সময় সকল ডেটা সঠিকভাবে সংরক্ষিত হয় কিনা",
    fields: ["name", "brand", "price", "sizes", "branchStock"],
    relatedTables: ["products"],
    expectedBehavior: `
      প্রোডাক্ট এডিট এবং সংরক্ষণ করা হলে:
      1. সিস্টেম ফিল্ড (_id, _creationTime) ফিল্টার করা হয়
      2. branchStock এবং currentStock ফিল্টার করা হয়
      3. শুধুমাত্র বৈধ ফিল্ড পাঠানো হয়
      4. মূল branchStock ডেটা সংরক্ষিত থাকে
    `
  },

  // ========== শাখা অনুযায়ী স্টক ==========
  {
    name: "Branch-wise Stock Tracking",
    description: "প্রতিটি শাখার স্টক স্বতন্ত্রভাবে ট্র্যাক করা হয় কিনা",
    fields: ["branchStock", "currentStock"],
    relatedTables: ["products", "stockManagement", "branches"],
    expectedBehavior: `
      স্টক ম্যানেজমেন্ট পেজে:
      1. শাখা নির্বাচন করলে সেই শাখার ইনভেন্টরি দেখা যায়
      2. লো স্টক আইটেম শাখা-অনুযায়ী ফিল্টার করা যায়
      3. প্রতিটি শাখার স্টক ভ্যালু আলাদাভাবে গণনা হয়
      4. ট্রান্সঅ্যাকশন হিস্টরি শাখা-অনুযায়ী লগ করা হয়
    `
  },
];

// ========== ম্যানুয়াল টেস্টিং গাইড ==========
export const TestingGuide = `

## 1. প্রোডাক্ট মূল্য আপডেট টেস্ট

ধাপ:
1. ইনভেন্টরি পেজ খুলুন
2. একটি প্রোডাক্ট খুঁজুন এবং এডিট করুন
3. costPrice এবং sellingPrice পরিবর্তন করুন
4. সংরক্ষণ করুন

যাচাই:
- ড্যাশবোর্ডে totalInventoryValue পরিবর্তিত হয়েছে কি?
- রিপোর্টে নতুন মূল্য দেখা যাচ্ছে কি?

---

## 2. স্টক লেভেল আপডেট টেস্ট

ধাপ:
1. ইনভেন্টরি পেজ খুলুন
2. একটি প্রোডাক্ট এডিট করুন
3. minStockLevel এবং maxStockLevel পরিবর্তন করুন
4. সংরক্ষণ করুন
5. স্টক ম্যানেজমেন্টে যান

যাচাই:
- স্টক ম্যানেজমেন্টে নতুন লেভেল দেখা যাচ্ছে কি?
- সকল শাখায় আপডেট হয়েছে কি?

---

## 3. বিক্রয় স্টক হ্রাস টেস্ট

ধাপ:
1. একটি বিক্রয় তৈরি করুন (POS থেকে)
2. কয়েকটি প্রোডাক্ট নির্বাচন করুন
3. চেকআউট সম্পন্ন করুন

যাচাই:
- ইনভেন্টরিতে স্টক হ্রাস পেয়েছে কি?
- স্টক ম্যানেজমেন্টে ব্র্যান্চ স্টক আপডেট হয়েছে কি?
- স্টক মুভমেন্ট লগে রেকর্ড হয়েছে কি?

---

## 4. স্টক ট্রান্সফার টেস্ট

ধাপ:
1. স্টক ট্রান্সফার পেজ খুলুন
2. উৎস এবং গন্তব্য শাখা নির্বাচন করুন
3. প্রোডাক্ট এবং পরিমাণ নির্বাচন করুন
4. ট্রান্সফার অনুমোদন এবং শিপ করুন

যাচাই:
- উৎস শাখার স্টক হ্রাস পেয়েছে কি?
- গন্তব্য শাখার স্টক বৃদ্ধি পেয়েছে কি?
- গ্লোবাল স্টক অপরিবর্তিত আছে কি?

---

## 5. ড্যাশবোর্ড টেস্ট

ধাপ:
1. ড্যাশবোর্ডে যান
2. কোন প্রোডাক্টের মূল্য আপডেট করুন
3. কিছু সময় অপেক্ষা করুন (রিয়েল-টাইম আপডেট)
4. ড্যাশবোর্ডে রিফ্রেশ করুন

যাচাই:
- totalInventoryValue পরিবর্তিত হয়েছে কি?
- lowStockCount সঠিক কি?
- বিক্রয় মেট্রিক্স আপডেট হয়েছে কি?

`;

// Export for testing
export default {
  DataSyncCheckpoints,
  TestingGuide,
  lastUpdated: "2026-01-30",
  version: "1.0",
};
