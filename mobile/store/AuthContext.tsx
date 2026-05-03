import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string; // text-based student ID (e.g. "ST001"), used for QR scan
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('hostel_token');
      const u = await AsyncStorage.getItem('hostel_user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    // backend returns { success: true, data: { token, ...user } }
    const { token: t, ...u } = res.data.data;
    
    // Set state immediately for UI response
    setToken(t);
    setUser(u as User);
    
    // Ensure persistence is completed
    await Promise.all([
      AsyncStorage.setItem('hostel_token', t),
      AsyncStorage.setItem('hostel_user', JSON.stringify(u))
    ]);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('hostel_token');
    await AsyncStorage.removeItem('hostel_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
