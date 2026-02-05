const CACHE_NAME = "dhb-v2";
const ASSET_CACHE = "dhb-assets-v1";
const API_CACHE = "dhb-api-v1";
const OFFLINE_CACHE = "dhb-offline-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/vite.svg",
];

// Offline fallback page
const OFFLINE_FALLBACK = new Response(
  `<!DOCTYPE html>
   <html>
   <head>
     <title>Dubai Borka House - Offline Mode</title>
     <style>
       body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
       .container { text-align: center; padding: 2rem; }
       h1 { color: #333; }
       p { color: #666; margin: 1rem 0; }
       .badge { display: inline-block; background: #7c3aed; color: white; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 1rem; }
     </style>
   </head>
   <body>
     <div class="container">
       <h1>📴 Offline Mode</h1>
       <p>You are currently offline</p>
       <p>Your cached data is available and changes will sync when you're back online</p>
       <div class="badge">✅ Local Storage Active</div>
     </div>
   </body>
   </html>`,
  {
    headers: { "Content-Type": "text/html" },
  }
);

// Cache expiration time (in milliseconds)
const CACHE_EXPIRY = {
  api: 5 * 60 * 1000,      // API: 5 minutes
  assets: 7 * 24 * 60 * 60 * 1000,  // Assets: 7 days
  document: 24 * 60 * 60 * 1000,    // Documents: 24 hours
};

// Install event - cache files aggressively
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache).catch(() => {
          console.log("Initial cache failed, continuing...");
        });
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        // Cache offline fallback
        return cache.put("/", OFFLINE_FALLBACK);
      })
    ]).then(() => self.skipWaiting())
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== "GET") {
    return;
  }

  // API requests - Network first, cache as fallback
  if (url.pathname.includes("/api/") || url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if offline
          return caches.match(request).then((response) => {
            return response || OFFLINE_FALLBACK;
          });
        })
    );
    return;
  }
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Asset requests (JS, CSS, images) - Cache first, network as fallback
  if (request.destination === "script" || 
      request.destination === "style" || 
      request.destination === "image" ||
      request.destination === "font") {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === "error") {
            return response;
          }
          const responseClone = response.clone();
          caches.open(ASSET_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        }).catch(() => {
          if (request.destination === "image") {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
              '<rect fill="#f0f0f0" width="200" height="200"/>' +
              '<text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="16">' +
              'Image unavailable</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
    );
    return;
  }

  // Document requests - Cache first, network as fallback
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      }).catch(() => {
        return caches.match("/index.html");
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, ASSET_CACHE, API_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Handle messages from clients (cache management)
self.addEventListener("message", (event) => {
  if (event.data.action === "clearCache") {
    caches.delete(API_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  } else if (event.data.action === "getCacheSize") {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ size });
    });
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}
