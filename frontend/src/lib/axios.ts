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

    const originalRequest = error.config;
    
    // If we receive a 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to get a fresh session. Supabase JS SDK handles token refresh automatically.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          // Update the authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          // Retry the original request
          return api(originalRequest);
        }
      } catch (err) {
        console.error("Session refresh failed", err);
      }
      
      // If we get here, the session is truly dead or refresh failed
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
