'use client';

import { useEffect } from 'react';

export function RuntimeConfig() {
  useEffect(() => {
    // Set up runtime environment variables
    // This allows configuring API URL at runtime via Docker environment variables
    if (typeof window !== 'undefined') {
      // Initialize window.__ENV__ if it doesn't exist
      (window as any).__ENV__ = (window as any).__ENV__ || {};
      
<<<<<<< HEAD
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
=======
      // Get API URL from build-time env (available at runtime in Docker)
      const buildTimeUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // If no build-time URL, try to construct from current location
      // This is useful when the frontend and backend are on the same domain
      let apiUrl = buildTimeUrl;
      
      if (!apiUrl) {
        // Try to infer from current hostname
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // If running in Docker/container, backend might be on same network
        // Try common backend ports
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          // In production, try same hostname with backend port
          apiUrl = `${protocol}//${hostname}:9090`;
        }
      }
      
      // Set in window for runtime access
      if (apiUrl) {
        (window as any).__ENV__.NEXT_PUBLIC_API_URL = apiUrl;
        console.log('🔧 Runtime API URL configured:', apiUrl);
      } else {
        console.warn('⚠️ No API URL configured. Using default localhost:9090');
        console.warn('💡 Configure NEXT_PUBLIC_API_URL as environment variable in Dokploy');
>>>>>>> 51604719b77c33a38e73c65d8b98fbd08a42ecd7
      }
    }
  }, []);

  return null;
}

