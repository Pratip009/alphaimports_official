'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setAnalyticsUserId } from '@/lib/analytics';
import { runAuthRequest } from '@/lib/api-client-error';

interface UserAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  avatarUrl?: string;
  address?: UserAddress;
  /** How this account can sign in. */
  authProviders?: ('password' | 'google')[];
  hasPassword?: boolean;
  googleLinked?: boolean;
  isGuest?: boolean;
}

interface AuthContextType {
  /** A real signed-in customer. Always null for guest-checkout sessions. */
  user: User | null;
  /** Shopping without an account (cart + checkout only). */
  guest: User | null;
  /** True when cart / checkout / orders calls will work (member or guest). */
  hasSession: boolean;
  /**
   * Makes sure there's a session for the cart. Signed-in customers already
   * have one; anyone else gets a guest session so they can shop without
   * creating an account. Call before adding to the cart.
   */
  ensureCartSession: () => Promise<void>;
  /** Signs in with a session the server already set (e.g. set-password link). */
  setSignedInUser: (user: User) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  /** Disconnect Google. Rejects if Google is the only sign-in method. */
  unlinkGoogle: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Puts a /me-style user object in the right slot.
  const applySession = useCallback((u: User | null) => {
    if (u?.isGuest) {
      setGuest(u);
      setUser(null);
    } else {
      setUser(u);
      setGuest(null);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      applySession(data.data);
      return true;
    }
    return false;
  }, [applySession]);

  const hasSessionHint = useCallback(() => {
    if (typeof document === 'undefined') return false;
    return document.cookie.split('; ').some((c) => c.startsWith('has_session='));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (hasSessionHint()) {
          await fetchMe();
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMe, hasSessionHint]);

  useEffect(() => {
    setAnalyticsUserId(user?.id ?? null);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await runAuthRequest<{ data: { user: User } }>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    applySession(data.data.user);
  }, [applySession]);

  const ensureCartSession = useCallback(async () => {
    if (user || guest) return;
    const data = await runAuthRequest<{ data: { user: User } }>('/api/auth/guest', {
      method: 'POST',
      credentials: 'include',
    });
    applySession(data.data.user);
  }, [user, guest, applySession]);

  const setSignedInUser = useCallback((u: User) => applySession(u), [applySession]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await runAuthRequest<{ data: { user: User } }>('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    setUser(data.data.user);
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const data = await runAuthRequest<{ data: { user: User } }>('/api/auth/verify-signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    applySession(data.data.user);
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      setGuest(null);
    }
  }, []);

  const unlinkGoogle = useCallback(async () => {
    const data = await runAuthRequest<{ data: { user: User } }>('/api/auth/google/unlink', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(data.data.user);
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      await fetchMe();
    } catch {
      // ignore — caller can decide what to do if this silently no-ops
    }
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{
      user,
      guest,
      hasSession: !!(user || guest),
      ensureCartSession,
      setSignedInUser,
      login,
      signup,
      verifyOtp,
      logout,
      updateUser,
      refreshUser,
      unlinkGoogle,
      isAdmin: user?.role === 'admin',
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}