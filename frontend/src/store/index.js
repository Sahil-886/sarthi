import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    setAuth: (user, token) => {
        localStorage.setItem('access_token', token);
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, isAuthenticated: false });
    },
    setUser: (user) => set({ user }),
}));
export const useUIStore = create((set) => ({
    currentPage: 'dashboard',
    setCurrentPage: (page) => set({ currentPage: page }),
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
export const useHealthStore = create((set) => ({
    stressScore: null,
    stressLevel: null,
    setStressScore: (score, level) => set({ stressScore: score, stressLevel: level }),
}));
