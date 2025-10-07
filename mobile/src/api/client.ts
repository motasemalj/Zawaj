import axios from 'axios';
import { create } from 'zustand';

type ApiState = {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
};

export const useApiState = create<ApiState>((set) => ({
  baseUrl: 'http://192.168.1.22:4000',
  setBaseUrl: (url) => set({ baseUrl: url }),
  currentUserId: null,
  setCurrentUserId: (id) => set({ currentUserId: id }),
}));

// Create a singleton axios instance
let apiInstance: ReturnType<typeof axios.create> | null = null;

export function getClient() {
  if (!apiInstance) {
    const { baseUrl } = useApiState.getState();
    apiInstance = axios.create({ baseURL: baseUrl, timeout: 10000 });
    
    // Add interceptor to dynamically set user ID on each request
    apiInstance.interceptors.request.use((config) => {
      const { currentUserId } = useApiState.getState();
      if (currentUserId) {
        config.headers['x-user-id'] = currentUserId;
      } else {
        delete config.headers['x-user-id'];
      }
      return config;
    });
  }
  
  return apiInstance;
}

export type User = {
  id: string;
  role: 'male' | 'female' | 'mother' | string;
  mother_for?: 'son' | 'daughter' | null;
  display_name: string;
  dob: string;
  city?: string | null;
  country?: string | null;
  education?: string | null;
  profession?: string | null;
  religiousness?: number | null;
  prayer_freq?: string | null;
  privacy_blur_mode: boolean;
  privacy_reveal_on_match: boolean;
  photos: { id: string; url: string; ordering: number; blurred: boolean }[];
  bio?: string | null;
};

export type Match = {
  id: string;
  user_a: User;
  user_b: User;
  created_at: string;
  last_message_at?: string | null;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

