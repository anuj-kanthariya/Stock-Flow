import axios from 'axios';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
};

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  company_name?: string;
  phone?: string;
  gst_number?: string;
  business_address?: string;
  company_logo_url?: string;
  profile_completed: boolean;
  invoice_prefix: string;
  invoice_numbering_preference: string;
  payment_terms?: string;
  tax_settings?: string;
  website?: string;
  upi_id?: string;
  bank_details?: string;
  avatar_url?: string;
  is_active: boolean;
  role: string;
  created_at: string;
  mobile_number?: string;
}

export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const response = await axios.get(`${API_URL}/api/v1/users/me`, {
    headers: await getHeaders(),
  });
  return response.data;
};

export const updateCurrentUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await axios.patch(`${API_URL}/api/v1/users/me`, data, {
    headers: await getHeaders(),
  });
  return response.data;
};

export const uploadCompanyLogo = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("file", file);

  const { data: { session } } = await supabase.auth.getSession();
  const response = await axios.post(`${API_URL}/api/v1/users/me/logo`, formData, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      // Do not manually set Content-Type to multipart/form-data here;
      // axios/browser will set it automatically with the correct boundary.
    },
  });
  return response.data;
};
