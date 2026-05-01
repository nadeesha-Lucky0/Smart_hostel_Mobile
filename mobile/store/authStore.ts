import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'warden' | 'admin' | 'security' | 'financial';
  phoneNumber?: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async (user, token) => {
    await SecureStore.setItemAsync('user_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('user_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
