import { showError } from './utils';
import axios from 'axios';

export const API = axios.create({
  baseURL: process.env.REACT_APP_SERVER ? process.env.REACT_APP_SERVER : '',
  timeout: 30000,
});

// Request interceptor: inject Authorization header from stored user token
API.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = 'Bearer ' + user.token;
        }
      }
    } catch (e) {
      // ignore malformed localStorage data
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      const currentPath = window.location.hash || '';
      if (!currentPath.includes('/login')) {
        window.location.href = '/#/login?expired=true';
      }
      return Promise.reject(error);
    }
    showError(error);
    return Promise.reject(error);
  }
);
