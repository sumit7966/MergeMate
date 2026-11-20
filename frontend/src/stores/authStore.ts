import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, orgName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('mergemate_token'),
  isAuthenticated: !!localStorage.getItem('mergemate_token'),
  isLoading: true,

  login: async (email, pass) => {
    const res = await api.login(email, pass);
    localStorage.setItem('mergemate_token', res.access_token);
    set({ token: res.access_token, user: res.user, isAuthenticated: true });
  },

  register: async (email, pass, name, orgName) => {
    const res = await api.register(email, pass, name, orgName);
    localStorage.setItem('mergemate_token', res.access_token);
    set({ token: res.access_token, user: res.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('mergemate_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('mergemate_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('mergemate_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

