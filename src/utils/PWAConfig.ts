import React from 'react';

/**
 * Phase 5: PWA Support Configuration
 * Enable offline access and installation capability
 */

// Configuration guide for vite.config.ts:
// npm install vite-plugin-pwa workbox-core workbox-precaching workbox-routing workbox-strategies

// Add to vite.config.ts:
// import { VitePWA } from 'vite-plugin-pwa'
// plugins: [
//   VitePWA({
//     registerType: 'autoUpdate',
//     manifest: {
//       name: 'Dubai Borka House - Staff Portal',
//       short_name: 'DBH Staff',
//       ...
//     }
//   })
// ]

/**
 * PWA Utility Functions
 */
export const PWAUtils = {
  /**
   * Register service worker
   */
  registerServiceWorker: async (): Promise<ServiceWorkerRegistration | null> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Check if app is installable
   */
  isInstallable: (): boolean => {
    return (
      'beforeinstallprompt' in window &&
      'serviceWorker' in navigator
    );
  },

  /**
   * Request installation prompt
   */
  requestInstall: async (): Promise<boolean> => {
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      return outcome === 'accepted';
    }

    return false;
  },

  /**
   * Check if app is installed
   */
  isInstalled: (): boolean => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    if ((window.navigator as any).standalone === true) {
      return true;
    }
    return false;
  },

  /**
   * Enable offline support with caching
   */
  enableOfflineSupport: async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const cacheNames = await caches.keys();
        const appCache = cacheNames.find((name) => name.startsWith('app-v'));

        if (appCache) {
          const cache = await caches.open(appCache);
          const urlsToCache = [
            '/',
            '/index.html',
            '/styles.css',
            '/app.js',
          ];

          await cache.addAll(urlsToCache);
          console.log('✅ Offline support enabled');
        }
      } catch (error) {
        console.error('❌ Failed to enable offline support:', error);
      }
    }
  },

  /**
   * Show notification
   */
  showNotification: async (title: string, options?: NotificationOptions): Promise<void> => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'dbh-notification',
        ...options,
      });
    }
  },

  /**
   * Request notification permission
   */
  requestNotificationPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  /**
   * Background sync for offline data
   */
  enableBackgroundSync: async (): Promise<void> => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        (registration as any).sync.register('sync-data');
        console.log('✅ Background sync enabled');
      } catch (error) {
        console.error('❌ Background sync setup failed:', error);
      }
    }
  },

  /**
   * Get app version
   */
  getAppVersion: (): string => {
    return 'Phase 5 - Mobile Optimized - v1.0.0';
  },

  /**
   * Get storage info
   */
  getStorageInfo: async (): Promise<{ usage: number; quota: number } | null> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  },
};

/**
 * React hook for PWA features
 */
export const usePWA = () => {
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [serviceWorkerReady, setServiceWorkerReady] = React.useState(false);

  React.useEffect(() => {
    // Check if installed
    setIsInstalled(PWAUtils.isInstalled());

    // Check if installable
    setIsInstallable(PWAUtils.isInstallable());

    // Register service worker
    PWAUtils.registerServiceWorker().then((sw) => {
      if (sw) setServiceWorkerReady(true);
    });

    // Handle install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return {
    isInstalled,
    isInstallable,
    serviceWorkerReady,
    installApp,
  };
};

export default PWAUtils;
