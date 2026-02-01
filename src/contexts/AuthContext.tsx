import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_SESSION_KEY = 'admin_session';

export interface AdminUser {
  username: string;
}

interface AuthContextType {
  user: AdminUser | null;
  session: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AdminUser;
    return data?.username ? { username: data.username } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const { data, error } = await supabase.rpc('check_admin_login', {
      p_username: username.trim(),
      p_password: password,
    });

    if (error) {
      return { error: new Error(error.message ?? 'Login failed') };
    }
    if (data !== true) {
      return { error: new Error('Invalid username or password') };
    }

    const adminUser = { username: username.trim() };
    setUser(adminUser);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser));
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }, []);

  const value: AuthContextType = {
    user,
    session: user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
