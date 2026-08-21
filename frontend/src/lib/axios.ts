import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

import { supabase } from './supabase';

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    // Get the current Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s and log errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log detailed error information for debugging
    console.error("=== API REQUEST FAILED ===");
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method?.toUpperCase());
    console.error("Status:", error.response?.status);
    console.error("Response Body:", error.response?.data);
    console.error("Error Message:", error.message);
    console.error("=========================");

    // If we receive a 401 and we aren't already on the login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
      // Clear supabase session if needed or just redirect
      await supabase.auth.signOut();
      
      window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);

export default api;
