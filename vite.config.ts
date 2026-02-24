import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "production" ? visualizer({ open: false }) : null,
    mode === "development"
      ? {
          name: "inject-chef-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Aggressive code splitting for better caching and lazy loading
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules/react")) return "react";
          if (id.includes("node_modules/react-dom")) return "react-dom";
          if (id.includes("node_modules/convex")) return "convex";
          
          // UI libraries
          if (id.includes("node_modules") && (
            id.includes("sonner") ||
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("jsbarcode") ||
            id.includes("qrcode")
          )) return "ui-libs";
          
          // Component-based chunks
          if (id.includes("src/components/Dashboard")) return "dashboard";
          if (id.includes("src/components/POS")) return "pos";
          if (id.includes("src/components/Reports")) return "reports";
          if (id.includes("src/components/OnlineStore")) return "online-store";
          if (id.includes("src/components/CouponManagement")) return "coupons";
          if (id.includes("src/components/CustomerLoyalty")) return "loyalty";
          
          // Common utilities
          if (id.includes("src/utils")) return "utils";
          if (id.includes("src/hooks")) return "hooks";
        },
      },
    },
    // Target modern browsers for smaller bundle
    target: "ES2020",
    // CSS code splitting for faster style delivery
    cssCodeSplit: true,
    // Minify for production
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
      },
    },
    // Source maps for debugging
    sourcemap: false,
    // Chunk size warnings (increased for monitoring)
    chunkSizeWarningLimit: 800,
    // Output optimization
    assetsInlineLimit: 4096,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "convex",
      "sonner",
      "jspdf",
      "html2canvas",
      "jsbarcode",
      "qrcode",
    ],
    exclude: ["@vite/client", "@vite/env"],
    // Preload commonly used dependencies
    esbuildOptions: {
      target: "ES2020",
    },
  },
  // Server optimizations
  server: {
    middlewareMode: false,
    // Enable gzip compression in dev
    compression: "gzip",
    // Optimize module prebundling
    preTransformRequests: true,
  },
}));
