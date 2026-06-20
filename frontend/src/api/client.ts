import axios from 'axios';
import { LOCAL_API_URL, PRODUCTION_API_URL } from '../config/urls';

// Hardcoded https backend — never use /api same-origin unless SWA backend is linked in Azure portal.
const devApiBase = import.meta.env.VITE_API_URL || LOCAL_API_URL;
const API_BASE = import.meta.env.DEV ? devApiBase : PRODUCTION_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Belt-and-suspenders: never allow http:// to Azure backend (mixed-content block)
    if (config.baseURL?.startsWith('http://') && !config.baseURL.includes('localhost')) {
      config.baseURL = config.baseURL.replace(/^http:\/\//i, 'https://');
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
