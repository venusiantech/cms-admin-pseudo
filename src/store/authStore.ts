import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  setAuth: (admin: Admin, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      setAuth: (admin, token) => {
        set({ admin, token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
      },
      logout: () => {
        set({ admin: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
        }
      },
      isAuthenticated: () => {
        return !!get().token;
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);

