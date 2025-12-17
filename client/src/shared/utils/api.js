import axios from 'axios';
import toast from 'react-hot-toast';
import { isTokenValid, clearInvalidTokens } from './tokenUtils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Check if token is valid before using it
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      // Token exists but is invalid/expired - clear it
      console.warn('Token expired or invalid, clearing localStorage');
      clearInvalidTokens();
      
      // If this is not a login request, redirect to login
      if (!config.url?.includes('/auth/login') && !config.url?.includes('/auth/register')) {
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired, please login again'));
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    const message = error.response?.data?.message || 'An error occurred';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status >= 400) {
      toast.error(message);
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;