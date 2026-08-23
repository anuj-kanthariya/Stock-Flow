import api from '../axios';

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
  const response = await api.get('/users/me');
  return response.data;
};

export const updateCurrentUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch('/users/me', data);
  return response.data;
};

export const uploadCompanyLogo = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post('/users/me/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadUserAvatar = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
