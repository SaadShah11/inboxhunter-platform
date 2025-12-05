import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  plan: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        return get().token !== null && get().user !== null;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

interface DashboardState {
  stats: any;
  agents: any[];
  recentSignups: any[];
  setStats: (stats: any) => void;
  setAgents: (agents: any[]) => void;
  setRecentSignups: (signups: any[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  agents: [],
  recentSignups: [],
  setStats: (stats) => set({ stats }),
  setAgents: (agents) => set({ agents }),
  setRecentSignups: (signups) => set({ recentSignups: signups }),
}));
