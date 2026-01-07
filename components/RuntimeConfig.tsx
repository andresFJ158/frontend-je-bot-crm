'use client';

import { useEffect } from 'react';

export function RuntimeConfig() {
  useEffect(() => {
    // Set up runtime environment variables
    // This allows configuring API URL at runtime via Docker environment variables
    if (typeof window !== 'undefined') {
      // Initialize window.__ENV__ if it doesn't exist
      (window as any).__ENV__ = (window as any).__ENV__ || {};
      
      // First, try to get from build-time env (injected during build)
      const buildTimeUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // If build-time URL is available and not localhost, use it
      if (buildTimeUrl && buildTimeUrl !== 'http://localhost:9090') {
        (window as any).__ENV__.NEXT_PUBLIC_API_URL = buildTimeUrl;
        console.log('🔧 Runtime API URL configured from build-time env:', buildTimeUrl);
      } else {
        // Try to fetch from server-side config endpoint (reads from runtime env vars)
        fetch('/api/config')
          .then(res => res.json())
          .then(data => {
            if (data.apiUrl && data.apiUrl !== 'http://localhost:9090') {
              (window as any).__ENV__.NEXT_PUBLIC_API_URL = data.apiUrl;
              console.log('🔧 Runtime API URL configured from server:', data.apiUrl);
              // Force a page reload to apply the new URL
              if (window.location.pathname === '/login') {
                window.location.reload();
              }
            } else {
              console.warn('⚠️ NEXT_PUBLIC_API_URL not configured correctly');
              console.warn('💡 Configure NEXT_PUBLIC_API_URL as environment variable in Dokploy');
              console.warn('💡 Example: NEXT_PUBLIC_API_URL=https://api.jebolivia.com.bo');
            }
          })
          .catch(err => {
            console.warn('⚠️ Could not fetch config from server:', err);
            console.warn('💡 Configure NEXT_PUBLIC_API_URL as environment variable in Dokploy');
          });
      }
    }
  }, []);

  return null;
}
