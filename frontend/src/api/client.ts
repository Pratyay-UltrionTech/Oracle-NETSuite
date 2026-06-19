import axios from 'axios';
import { LOCAL_API_URL, PRODUCTION_API_URL } from '../config/urls';

function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  const url = fromEnv || (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);

  // Prevent mixed-content blocks when Azure build env or stale config uses http://
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://') &&
    !url.includes('localhost')
  ) {
    return url.replace(/^http:\/\//, 'https://');
  }

  return url;
}

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized, clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
