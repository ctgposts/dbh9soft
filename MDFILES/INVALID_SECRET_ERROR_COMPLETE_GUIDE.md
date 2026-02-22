# 🔧 Convex InvalidSecret Error - সম্পূর্ণ সমাধান গাইড

## সমস্যা

```
[CONVEX A(auth:signIn)] Server Error
Uncaught Error: InvalidSecret
```

---

## কারণ বিশ্লেষণ

### ১. CONVEX_AUTH_SECRET Missing

Convex development mode এ authentication secret প্রয়োজন।

### ২. Auth Configuration Issue

Auth provider properly configured না থাকা।

---

## ✅ সমাধান

### Option 1: Development Mode সহ Fresh Restart

```bash
# Terminal এ:

# ১. Convex dev env চেক করুন
npx convex dev

# ২. এটি automatic secret generate করবে
# Console এ output check করুন

# ৩. নতুন Terminal এ app run করুন
npm run dev
```

**Output look করুন:**
```
✔ Created schema in convex/
✔ Functions codegen'ed in convex/_generated/
📙 Auth secret saved locally
```

---

### Option 2: Manual Secret Setup

```bash
# Generate আপনার নিজের secret:
npx convex env set CONVEX_AUTH_SECRET <any-random-string>

# Example:
npx convex env set CONVEX_AUTH_SECRET "my-super-secret-key-12345"
```

---

### Option 3: Verify Current Setup

```bash
# দেখুন আপনার deployment এ কি রয়েছে:
npx convex env list
```

এটি show করবে সব environment variables।

---

## 📋 Checklist

**Local Development:**
- [ ] `npx convex dev` চলছে দূসরা terminal এ
- [ ] `.env.local` ফাইল আছে সঠিক `VITE_CONVEX_URL` সহ
- [ ] `npm run dev` দিয়ে app চালু করেছেন
- [ ] Browser console এ "Auth secret saved locally" দেখা গেছে

**Environment Variables (.env.local):**
```dotenv
CONVEX_DEPLOY_KEY=project:...
CONVEX_DEPLOYMENT=dev:hardy-yak-685
VITE_CONVEX_URL=https://hardy-yak-685.convex.cloud
```

---

## 🚨 যদি এখনও Error থাকে:

### Step 1: Clear Everything

```bash
# Clear Convex cache
rm -rf .convex

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npx convex dev
```

### Step 2: Fresh Start

```bash
# New Terminal এ:
npm run dev
```

---

## 🔍 Debugging

### Browser Console এ দেখুন:

1. **Green checkmark ✅** - Auth secret setup correctly
2. **Red error ❌** - Still misconfigured

### Network Tab এ দেখুন:

- `/auth/signIn` request যায় কোথায়?
- Response error কি?

---

## ✨ সফল সাইনইন এর পরে:

একবার authenticate হলে:

1. Dashboard load হবে
2. 12টি roles auto-initialize হবে
3. Menu সব feature দেখাবে

---

## 🎯 আপনার Case

আপনার configuration দেখে মনে হচ্ছে:

```dotenv
✅ CONVEX_DEPLOY_KEY: সঠিক
✅ CONVEX_DEPLOYMENT: dev mode
✅ VITE_CONVEX_URL: সঠিক
❓ CONVEX_AUTH_SECRET: Maybe missing locally
```

---

## পরবর্তী ধাপ

1. নিচের command run করুন:

```bash
npx convex dev
```

2. এটি console এ বলবে আপনার auth secret status
3. আমাকে feedback দিন error disappear করেছে কিনা
4. যদি না, আমরা আরও debug করব

---

**Need Help?** জানাবেন কি error দেখাচ্ছে সেখানে! 🚀
