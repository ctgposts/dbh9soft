# 🎯 Quick Start Guide - Using Optimizations

This guide shows you how to use the new performance and responsiveness features.

---

## 1. Using Responsive Components

### ResponsiveContainer
Automatically adjusts padding based on screen size:

```tsx
import { ResponsiveContainer } from "@/utils/responsive";

export function MyComponent() {
  return (
    <ResponsiveContainer className="bg-white">
      <h1>Mobile-friendly content</h1>
      <p>Automatically scales padding: mobile (12px) → tablet (16px) → desktop (32px)</p>
    </ResponsiveContainer>
  );
}
```

### ResponsiveGrid
Creates responsive layouts with automatic column adjustment:

```tsx
import { ResponsiveGrid } from "@/utils/responsive";

export function ProductList() {
  return (
    <ResponsiveGrid 
      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
      gap="gap-4"
    >
      <div>Product 1</div>
      <div>Product 2</div>
      <div>Product 3</div>
      <div>Product 4</div>
    </ResponsiveGrid>
  );
}
```

### ResponsiveText
Responsive typography:

```tsx
import { ResponsiveText } from "@/utils/responsive";

export function Heading() {
  return (
    <ResponsiveText
      sizes={{
        mobile: "text-lg",
        tablet: "sm:text-xl",
        desktop: "md:text-2xl"
      }}
      className="font-bold"
    >
      My Heading
    </ResponsiveText>
  );
}
```

---

## 2. Using Performance Utilities

### Debounce (for search, filter)
```tsx
import { debounce } from "@/utils/performance";

export function SearchProducts() {
  const [query, setQuery] = useState("");
  
  const handleSearch = debounce((searchTerm: string) => {
    console.log("Searching for:", searchTerm);
    // API call here
  }, 300); // Wait 300ms after user stops typing

  return (
    <input
      type="text"
      onChange={(e) => {
        setQuery(e.target.value);
        handleSearch(e.target.value);
      }}
      placeholder="Search products..."
    />
  );
}
```

### Throttle (for scroll events)
```tsx
import { throttle } from "@/utils/performance";

export function ScrollableList() {
  const handleScroll = throttle((e) => {
    const { scrollTop } = e.target;
    console.log("Scroll position:", scrollTop);
  }, 100); // Max 10 times per second

  return (
    <div onScroll={handleScroll} style={{ height: "400px", overflow: "auto" }}>
      {/* Long list content */}
    </div>
  );
}
```

### Memoize (for expensive calculations)
```tsx
import { memoize } from "@/utils/performance";

const calculateTotal = memoize((products: Product[]) => {
  // Complex calculation
  return products.reduce((sum, p) => sum + p.price, 0);
});

export function Cart({ products }) {
  const total = calculateTotal(products);
  return <div>Total: {total}</div>;
}
```

### Preload Images
```tsx
import { preloadImage } from "@/utils/performance";

export function GalleryPage() {
  useEffect(() => {
    // Preload images for faster display
    preloadImage("/images/gallery-1.jpg");
    preloadImage("/images/gallery-2.jpg");
    preloadImage("/images/gallery-3.jpg");
  }, []);

  return (
    <div>
      <img src="/images/gallery-1.jpg" alt="1" />
      <img src="/images/gallery-2.jpg" alt="2" />
      <img src="/images/gallery-3.jpg" alt="3" />
    </div>
  );
}
```

---

## 3. Using Performance Monitoring

### Monitor Web Vitals
Automatically called on app start in production:

```tsx
import { monitorWebVitals } from "@/utils/monitoring";

// Called automatically in production
// Monitors: LCP, CLS, FID
// Check browser console for metrics
```

### Measure Performance
```tsx
import { measurePerformance, measurePerformanceAsync } from "@/utils/monitoring";

// Sync operation
const result = measurePerformance("list-sort", () => {
  return [...items].sort((a, b) => a - b);
});

// Async operation
const data = await measurePerformanceAsync("fetch-products", async () => {
  const response = await fetch("/api/products");
  return response.json();
});
```

### Report Performance to Server
```tsx
import { reportPerformance } from "@/utils/monitoring";

useEffect(() => {
  window.addEventListener("beforeunload", () => {
    // Report metrics before user leaves
    reportPerformance("/api/analytics/performance");
  });
}, []);
```

---

## 4. Responsive Breakpoints Reference

Use these Tailwind breakpoints throughout your code:

```tsx
// Mobile first (base styles apply to mobile)
<div className="text-sm">Default (mobile)</div>

// Tablet (768px and up)
<div className="text-sm sm:text-base">Mobile to Tablet</div>

// Desktop (1024px and up)
<div className="text-sm sm:text-base md:text-lg">Mobile to Desktop</div>

// Large Desktop (1280px and up)
<div className="text-sm sm:text-base md:text-lg lg:text-xl">Large Desktop</div>

// Extra Large (1536px and up)
<div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">Extra Large</div>
```

---

## 5. Lazy Loading Components

Components are already lazy loaded in `App.tsx`:

```tsx
// In App.tsx, components are lazy loaded with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Inventory />
</Suspense>

// Add this pattern to other components if needed
const MyComponent = lazy(() => 
  import("./components/MyComponent").then(m => ({ default: m.MyComponent }))
);
```

---

## 6. Performance Best Practices

### ✅ DO

```tsx
// Use memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// Use useCallback for handlers
const handleClick = useCallback(() => {
  doSomething();
}, []);

// Use lazy loading for heavy components
const HeavyComponent = lazy(() => import("./Heavy"));

// Debounce search/filter inputs
const handleSearch = debounce((query) => search(query), 300);

// Preload critical images
preloadImage("/critical-image.jpg");
```

### ❌ DON'T

```tsx
// Don't create objects in renders
const options = { sort: "name" }; // Bad! Creates new object each render

// Don't fetch on every render
useEffect(() => {
  fetchData(); // Bad! No dependency array
}, []);

// Don't debounce in render
const search = debounce(handleSearch); // Bad! Creates new function each render

// Don't load all images at once
<img src="/image-1.jpg" />
<img src="/image-2.jpg" />
<img src="/image-3.jpg" /> // Bad! Load on demand or lazy load
```

---

## 7. Testing Performance

### In Chrome DevTools

1. **Lighthouse Audit**
   - Click Lighthouse tab
   - Run audit
   - Target score: 90+

2. **Performance Tab**
   - Record performance
   - Look for long tasks
   - Check main thread usage

3. **Network Tab**
   - Set to Slow 3G
   - Check asset sizes
   - Check waterfall timing

4. **Coverage Tab**
   - Check CSS/JS usage
   - Remove unused code
   - Identify unused libraries

### Mobile Testing

```bash
# Build production
npm run build

# Serve locally
npx http-server dist

# Test on mobile device
# Navigate to your laptop IP: http://192.168.x.x:8080
```

---

## 8. Environment Variables

Add to `.env`:

```env
VITE_CONVEX_URL=https://your-convex-url.convex.cloud

# Analytics endpoint (optional)
VITE_ANALYTICS_URL=https://your-analytics.com/api
```

---

## 9. Deployment Tips

### For Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_CONVEX_URL": "@convex_url"
  }
}
```

### For Netlify
```toml
[build]
command = "npm run build"
publish = "dist"

[env]
VITE_CONVEX_URL = "your-convex-url"
```

### For Self-Hosted
1. Run `npm run build`
2. Deploy `dist/` folder to server
3. Configure server for SPA (all 404s → index.html)
4. Enable gzip compression
5. Set cache headers properly

---

## 10. Common Issues & Solutions

### Issue: Service Worker not registering
**Solution:**
```tsx
// In development, service workers may not work
// They work correctly in production
// Test with: npm run build && npx http-server dist
```

### Issue: Lazy components not loading
**Solution:**
```tsx
// Make sure Suspense has a fallback
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>

// Check browser console for errors
```

### Issue: Responsive design not working
**Solution:**
```tsx
// Clear browser cache (Cmd/Ctrl + Shift + R)
// Check viewport meta tag in index.html
// Use mobile device emulation in DevTools
```

### Issue: Performance not improving
**Solution:**
```tsx
// Check bundle size: npm run build (look for stats.html)
// Monitor with DevTools Lighthouse
// Use Performance tab to identify bottlenecks
// Profile with Chrome Performance tab
```

---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Performance](https://react.dev/reference/react/useMemo)
- [Web Vitals](https://web.dev/vitals/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

Happy optimizing! 🚀
