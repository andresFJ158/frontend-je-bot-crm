import axios from 'axios';

// Auto-detect HTTPS if API URL uses HTTPS, otherwise use HTTP
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    // If URL contains traefik.me, always use HTTPS (Traefik typically uses HTTPS)
    if (envUrl.includes('traefik.me')) {
      return envUrl.replace('http://', 'https://');
    }
    // If already HTTPS, keep it
    if (envUrl.startsWith('https://')) {
      return envUrl;
    }
    return envUrl;
  }
  return 'http://localhost:9090';
};

const API_URL = getApiUrl();

// Log API URL for debugging
if (typeof window !== 'undefined') {
  console.log('🔗 API URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

