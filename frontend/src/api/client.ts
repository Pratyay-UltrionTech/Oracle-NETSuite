import axios from 'axios';
import { LOCAL_API_URL, PRODUCTION_API_URL } from '../config/urls';

function secureApiUrl(url: string): string {
  if (url.includes('localhost')) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

// Always use hardcoded urls.ts in production — ignore VITE_API_URL (Azure may set http://)
const API_URL = secureApiUrl(import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.baseURL) {
      config.baseURL = secureApiUrl(config.baseURL);
    }
    if (typeof config.url === 'string' && config.url.startsWith('http://')) {
      config.url = secureApiUrl(config.url);
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
