import axios from 'axios';

// Function to get API URL dynamically (checks runtime config first, then build-time)
const getApiUrl = () => {
  // First, try to get from localStorage (manual override for debugging)
  let envUrl: string | undefined;
  
  if (typeof window !== 'undefined') {
    const manualUrl = localStorage.getItem('API_URL_OVERRIDE');
    if (manualUrl) {
      envUrl = manualUrl;
      console.log('🔧 Using manual API URL override:', envUrl);
    }
  }
  
  // Second, try to get from runtime config (window.__ENV__)
  if (!envUrl && typeof window !== 'undefined') {
    const windowEnv = (window as any).__ENV__;
    if (windowEnv?.NEXT_PUBLIC_API_URL) {
      envUrl = windowEnv.NEXT_PUBLIC_API_URL;
    }
  }
  
  // Fallback to build-time environment variable
  if (!envUrl) {
    envUrl = process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (envUrl) {
    // Don't use inferred URLs that look like they came from the frontend hostname
    // Only use explicitly configured URLs
    if (envUrl.includes('traefik.me') && envUrl.includes(':9090')) {
      // This looks like an incorrectly inferred URL, ignore it
      console.warn('⚠️ Ignoring inferred API URL:', envUrl);
      console.warn('💡 Please configure NEXT_PUBLIC_API_URL correctly');
      envUrl = undefined;
    }
    
    if (envUrl) {
      // If URL contains traefik.me (without port), always use HTTPS
      if (envUrl.includes('traefik.me') && !envUrl.includes(':9090')) {
        return envUrl.replace('http://', 'https://');
      }
      // If already HTTPS, keep it
      if (envUrl.startsWith('https://')) {
        return envUrl;
      }
      // If HTTP, use as is
      if (envUrl.startsWith('http://')) {
        return envUrl;
      }
      return envUrl;
    }
  }
  return 'http://localhost:9090';
};

// Initial API URL
const initialApiUrl = getApiUrl();

// Log API URL for debugging
if (typeof window !== 'undefined') {
  console.log('🔗 API URL:', initialApiUrl);
}

const api = axios.create({
  baseURL: initialApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL dynamically before each request (allows runtime configuration)
api.interceptors.request.use((config) => {
  const dynamicUrl = getApiUrl();
  config.baseURL = dynamicUrl;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login'];
  const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (!isPublicRoute) {
    // If no token and not a public route, log warning
    console.warn('No token found for protected route:', config.url);
    console.warn('localStorage token:', localStorage.getItem('token'));
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token immediately
      const hadToken = !!localStorage.getItem('token');
      const errorMessage = error.response?.data?.message || error.message;
      
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('agent');
      
      // Clear Zustand store state
      try {
        const store = require('@/lib/store').useStore.getState();
        if (store.setToken) store.setToken('');
        if (store.setAgent) store.setAgent(null);
        if (store.disconnectSocket) store.disconnectSocket();
      } catch (e) {
        // Store might not be available, ignore
      }
      
      if (hadToken) {
        console.error('❌ Authentication failed:', errorMessage);
        console.warn('🔑 Token inválido - probablemente JWT_SECRET cambió. Limpiando sesión...');
        
        // Store error message in sessionStorage for login page to display
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('authError', 'Tu sesión ha expirado o el token es inválido. Por favor, inicia sesión nuevamente.');
        }
      }
      
      // Always redirect to login if not already there
      // Use a more aggressive redirect approach
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/') {
          console.warn('🔄 Redirigiendo al login...');
          // Use both methods to ensure redirect works
          setTimeout(() => {
            window.location.href = '/login';
          }, 0);
          // Also try replace as backup
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

