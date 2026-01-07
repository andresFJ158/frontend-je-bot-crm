'use client';

import { useEffect } from 'react';

export function RuntimeConfig() {
  useEffect(() => {
    // Set up runtime environment variables
    // This allows configuring API URL at runtime via Docker environment variables
    if (typeof window !== 'undefined') {
      // Initialize window.__ENV__ if it doesn't exist
      (window as any).__ENV__ = (window as any).__ENV__ || {};
      
      // Get API URL from build-time env (injected during build)
      // This will only work if NEXT_PUBLIC_API_URL was set during the Docker build
      const buildTimeUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Only use build-time URL if it's available and not localhost
      // This prevents using incorrect inferred URLs
      if (buildTimeUrl && buildTimeUrl !== 'http://localhost:9090') {
        (window as any).__ENV__.NEXT_PUBLIC_API_URL = buildTimeUrl;
        console.log('🔧 Runtime API URL configured from build-time env:', buildTimeUrl);
      } else {
        console.warn('⚠️ NEXT_PUBLIC_API_URL not configured correctly');
        console.warn('💡 Configure NEXT_PUBLIC_API_URL as Build Argument in Dokploy');
        console.warn('💡 Example: NEXT_PUBLIC_API_URL=https://api.jebolivia.com.bo');
        console.warn('💡 Then rebuild the Docker image');
      }
    }
  }, []);

  return null;
}

