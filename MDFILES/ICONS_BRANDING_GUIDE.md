# আইকন এবং ব্র্যান্ডিং ডকুমেন্টেশন

## ওভারভিউ
Dubai Borka House ওয়েব অ্যাপ্লিকেশনের জন্য সম্পূর্ণ আইকন এবং ব্র্যান্ডিং সেটআপ করা হয়েছে।

## তৈরি করা ফাইলগুলি

### SVG লোগো
- **`public/logo.svg`** - মূল ভেক্টর লোগো যা সব আকারে স্কেল করা যায়

### ফেবিকন (Favicon)
- **`public/favicon-16.png`** - 16x16 পিক্সেল (ব্রাউজার ট্যাব)
- **`public/favicon-32.png`** - 32x32 পিক্সেল (ব্রাউজার ট্যাব উচ্চ রেজোলিউশন)
- **`public/favicon.png`** - 64x64 পিক্সেল

### অ্যাপ আইকন
- **`public/icon-192x192.png`** - 192x192 পিক্সেল (স্মার্টফোন হোম স্ক্রিন)
- **`public/icon-512x512.png`** - 512x512 পিক্সেল (বড় ডিসপ্লে, স্প্ল্যাশ স্ক্রিন)
- **`public/apple-touch-icon.png`** - 180x180 পিক্সেল (Apple ডিভাইস)

### PWA কনফিগারেশন
- **`public/manifest.json`** - Progressive Web App ম্যানিফেস্ট ফাইল
- **`index.html`** - সম্পূর্ণ আইকন এবং মেটা ট্যাগ রেফারেন্স সহ আপডেট করা

## লোগো ডিজাইন বিস্তারিত

### রঙ স্কিম
- **প্রধান গ্রেডিয়েন্ট**: `#7c3aed` থেকে `#5b21b6` (বেগুনি রঙ)
- **সেকেন্ডারি**: সাদা (শাদা আবায়া চিত্র)
- **উচ্চারণ**: বেগুনি (সজ্জা প্যাটার্ন)

### ডিজাইন উপাদান
- **মাথার আবরণ**: ইসলামিক হিজাব/মাথার আবরণ
- **শরীর**: ঐতিহ্যবাহী আবায়া সিলুয়েট
- **হাতের কাজ**: সূক্ষ্ম সজ্জা প্যাটার্ন

## HTML ইন্টিগ্রেশন

নিম্নলিখিত মেটা ট্যাগ এবং লিংকগুলি `index.html` এ যোগ করা হয়েছে:

```html
<!-- Favicons and App Icons -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#7c3aed" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="DBH" />

<!-- Open Graph -->
<meta property="og:image" content="/icon-512x512.png" />
```

## PWA সাপোর্ট

**manifest.json** সম্পূর্ণভাবে কনফিগার করা হয়েছে:

- ✅ অ্যাপ নাম: Dubai Borka House
- ✅ শর্ট নাম: DBH
- ✅ থিম রঙ: #7c3aed
- ✅ ডিসপ্লে মোড: standalone
- ✅ সব আকারের আইকন
- ✅ মাস্কেবল আইকন সাপোর্ট

## ব্যবহার গাইড

### লোগো কাস্টমাইজ করা
যদি আপনার লোগো পরিবর্তন করতে চান:

1. **SVG সম্পাদনা**: `public/logo.svg` সম্পাদনা করুন
2. **আইকন পুনরায় তৈরি করুন**: 
   ```bash
   node generate-icons.mjs
   ```

### ব্র্যান্ড রঙ পরিবর্তন করা
1. `public/logo.svg` এ গ্রেডিয়েন্ট কোড আপডেট করুন
2. `manifest.json` এ `theme_color` আপডেট করুন
3. `index.html` এ `theme-color` মেটা ট্যাগ আপডেট করুন
4. `tailwind.config.js` এ প্রধান রঙ আপডেট করুন

### মোবাইল ডিভাইসে পরীক্ষা করা
1. মোবাইল ব্রাউজার থেকে সাইট পরিদর্শন করুন
2. "হোম স্ক্রিনে যোগ করুন" বিকল্প ব্যবহার করুন
3. অ্যাপ লঞ্চ করুন এবং আইকন দেখুন

## ফাইল জেনারেশন স্ক্রিপ্ট

**`generate-icons.mjs`** - Sharp লাইব্রেরি ব্যবহার করে SVG থেকে সব আকারের PNG আইকন তৈরি করে।

## সর্বোত্তম অনুশীলন

- ✅ সব ব্রাউজার এবং ডিভাইসে সামঞ্জস্যপূর্ণ আইকন
- ✅ PWA সম্পূর্ণ সমর্থিত
- ✅ সোশ্যাল মিডিয়া শেয়ারিং অপটিমাইজড
- ✅ অ্যাপল ডিভাইস সাপোর্ট
- ✅ রেসপন্সিভ মেটা ট্যাগ

## আরও তথ্য

- [PWA Manifest স্পেসিফিকেশন](https://www.w3.org/TR/appmanifest/)
- [Favicon Best Practices](https://realfavicongenerator.net/)
- [Apple Web Clips](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
