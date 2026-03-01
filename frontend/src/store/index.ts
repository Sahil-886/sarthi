import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set: any) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  setAuth: (user: User, token: string) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user: User) => set({ user }),
}));


interface UIStore {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set: any) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page: string) => set({ currentPage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));

interface HealthStore {
  stressScore: number | null;
  stressLevel: 'low' | 'moderate' | 'high' | null;
  setStressScore: (score: number, level: 'low' | 'moderate' | 'high') => void;
}

export const useHealthStore = create<HealthStore>((set: any) => ({
  stressScore: null,
  stressLevel: null,
  setStressScore: (score: number, level: 'low' | 'moderate' | 'high') => set({ stressScore: score, stressLevel: level }),
}));
