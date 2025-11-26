import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile as apiGetProfile } from '../api/client';

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * AuthProvider wraps app with authentication state and methods.
 */
export function AuthProvider({ children }) {
  /** Auth state is stored in memory and persisted to localStorage. */
  const [token, setToken] = useState(() => window.localStorage.getItem('token') || '');
  const [user, setUser] = useState(null); // { id, email, is_admin, ... }
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Persist/remove token
  useEffect(() => {
    if (token) {
      window.localStorage.setItem('token', token);
    } else {
      window.localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Load profile whenever we have a token
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!token) return;
      setAuthLoading(true);
      setAuthError('');
      try {
        const profile = await apiGetProfile();
        if (!cancelled) setUser(profile || null);
      } catch (err) {
        if (!cancelled) {
          setAuthError(err?.message || 'Failed to load profile');
          // Token likely invalid; clear it to force re-auth
          setToken('');
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [token]);

  // PUBLIC_INTERFACE
  const login = useCallback(async (email, password) => {
    /** Authenticate user and store JWT token. After storing, quickly verify with /auth/profile. */
    setAuthLoading(true);
    setAuthError('');
    const data = await apiLogin(email, password);
    if (data?.token) {
      setToken(data.token);
      // Ensure interceptor sees token immediately for the follow-up call
      window.localStorage.setItem('token', data.token);
      try {
        // Quick verification call that also validates CORS and auth header handling
        const profile = await apiGetProfile();
        setUser(profile || null);
      } catch (err) {
        // If token invalid, clear and surface error
        setToken('');
        window.localStorage.removeItem('token');
        setUser(null);
        setAuthLoading(false);
        throw err;
      }
    }
    setAuthLoading(false);
    return data;
  }, []);

  // PUBLIC_INTERFACE
  const register = useCallback(async (payload) => {
    /** Register a new user; does not auto-login by default. */
    const data = await apiRegister(payload);
    return data;
  }, []);

  // PUBLIC_INTERFACE
  const logout = useCallback(async () => {
    /** Clear token and call backend logout (best-effort). */
    try {
      await apiLogout();
    } finally {
      setToken('');
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    token,
    isAuthenticated: !!token,
    isAdmin: !!(user?.is_admin),
    user,
    authLoading,
    authError,
    login,
    register,
    logout
  }), [token, user, authLoading, authError, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * RequireAuth guards private routes; redirects to /login if not authenticated.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

/**
 * PUBLIC_INTERFACE
 * RequireAdmin guards admin routes; redirects to /login if unauthenticated,
 * or to /roles if authenticated but not an admin.
 */
export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin, authLoading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (authLoading) {
    return <div className="container" role="status" aria-live="polite">Loading…</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/roles" replace />;
  }
  return children;
}
