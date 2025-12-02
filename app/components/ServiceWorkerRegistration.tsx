'use client';

import React, { useEffect } from 'react';

export const ServiceWorkerRegistration: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Check if we're in development (localhost or 127.0.0.1)
    const isDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '';

    if (isDevelopment) {
      // In development, always unregister service workers to prevent caching issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then((success) => {
            if (success) {
              console.log('Service Worker unregistered for development');
              // Clear all caches
              if ('caches' in window) {
                caches.keys().then((cacheNames) => {
                  return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                  );
                });
              }
            }
          });
        });
      });
      return;
    }

    // In production, register service worker
    // Unregister old service workers first
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });

    // Register new service worker after a delay
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
          registration.update();
        })
        .catch((error) => {
          // Silently fail - service worker is optional
          console.log('Service Worker registration skipped:', error.message);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }, []);

  return null;
};

