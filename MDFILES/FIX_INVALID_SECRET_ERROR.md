# 🔴 Critical: InvalidSecret Error - Convex Authentication Issue

## সমস্যা বিশ্লেষণ

আপনার app এ দুটি মূল সমস্যা রয়েছে:

### ১. **Service Worker Registration Failed**
```
ServiceWorker script evaluation failed
```
**সমাধান:** 
- `public/sw.js` file check করুন
- Service Worker সঠিকভাবে কাজ করছে কিনা verify করুন

---

### ২. **InvalidSecret Error (CRITICAL) 🔴**
```
[CONVEX A(auth:signIn)] Server Error
Uncaught Error: InvalidSecret
```

## এটা কি?

Convex authentication secret configuration সঠিক নেই।

## সমাধান ধাপ

### Step 1: Environment Variables চেক করুন

```bash
# .env.local file এ check করুন:
CONVEX_DEPLOYMENT_URL=https://your-deployment.convex.cloud
```

If এটি missing বা wrong হলে, set করুন।

### Step 2: Convex Setup Check

```bash
# Terminal এ run করুন:
npx convex auth login
npx convex env set CONVEX_AUTH_SECRET your-secret-here
```

### Step 3: Convex Backend Verify

```bash
# Convex status check:
npx convex status
```

আপনার deployment সঠিক কিনা verify করুন।

### Step 4: Clear Cache & Restart

```bash
# Clear node modules cache
npm run dev
```

---

## Quick Fix Checklist

- [ ] `.env.local` file exists
- [ ] `CONVEX_DEPLOYMENT_URL` set correctly
- [ ] Convex backend is deployed
- [ ] AuthConfig properly configured in `convex/auth.config.ts`
- [ ] `npm install` has been run
- [ ] Dev server restarted

---

## যদি সমস্যা থাকে তাহলে:

আমাকে জানান:
1. `.env.local` ফাইলের content (secrets ছাড়া)
2. `convex auth.config.ts` এর কোড
3. Convex dashboard এ deployment status

তাহলে আমি সঠিক সমাধান দিতে পারব।

---

**এই issue resolve হওয়ার পর আমরা ৪০টি Functional Cards implement করতে পারব।**
