# Fix: Convex API Regeneration Required

## The Error

```
Error: [CONVEX Q(discountUtils:getDiscountStats)] [Request ID: ae500cb409f5c905] Server Error
Could not find public function for 'discountUtils:getDiscountStats'. 
Did you forget to run `npx convex dev` or `npx convex deploy`?
```

## Root Cause

The frontend is calling `api.discountUtils.getDiscountStats()` which is defined in `convex/discountUtils.ts`, but Convex hasn't regenerated the type definitions in `convex/_generated/api.d.ts`.

This happens because:
1. Backend functions were added to `discountUtils.ts`
2. Convex dev server wasn't restarted to regenerate types
3. Frontend tries to call functions that aren't in the generated API types

## Solution

### **Step 1: Stop the Convex Dev Server**
If running, stop it with `Ctrl+C`

### **Step 2: Regenerate Types**
Run one of these commands:

**Option A: Start dev server (recommended)**
```bash
npx convex dev
```
This will:
- Regenerate all API types
- Start watching for changes
- Keep local development running

**Option B: Deploy to production**
```bash
npx convex deploy
```

### **Step 3: Verify Types Generated**
Check that these files updated:
- `convex/_generated/api.d.ts` - Should now include `discountUtils` namespace
- `convex/_generated/api.js` - Runtime API routes

### **Step 4: Refresh Browser**
- Hard refresh your browser (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
- Clear local cache if needed

## What Gets Fixed

✅ `api.discountUtils.getDiscountStats` becomes available  
✅ `api.discountUtils.toggleDiscountStatus` becomes available  
✅ All other discount utility functions work  
✅ DiscountManagement component can use the queries/mutations  
✅ Loyalty system backend APIs available (once Convex regenerates)

## Commands Quick Reference

```bash
# Stop Convex dev server
Ctrl+C

# Regenerate and watch
npx convex dev

# Deploy to production
npx convex deploy

# Check status
npx convex query

# View logs
npx convex logs
```

## Troubleshooting

**If error persists after `npx convex dev`:**

1. Check that `convex/discountUtils.ts` exists
2. Verify exports use proper syntax:
   ```typescript
   export const functionName = query({ ... })
   export const functionName = mutation({ ... })
   ```

3. Check for TypeScript errors in backend files:
   ```bash
   npx tsc --noEmit
   ```

4. Clear node_modules and reinstall:
   ```bash
   rm -r node_modules package-lock.json
   npm install
   npx convex dev
   ```

## Status

**Current:** ⏳ Waiting for Convex type regeneration  
**Action:** Run `npx convex dev` in project directory  
**Time to fix:** < 30 seconds

---

Once you run `npx convex dev`, the Discount Management stats and all other Convex queries will work immediately!
