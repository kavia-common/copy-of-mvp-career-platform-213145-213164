import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/client';

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * AuthProvider wraps app with authentication state and methods.
 */
export function AuthProvider({ children }) {
  /** Auth state is stored in memory and persisted to localStorage. */
  const [token, setToken] = useState(() => window.localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      window.localStorage.setItem('token', token);
    } else {
      window.localStorage.removeItem('token');
    }
  }, [token]);

  // PUBLIC_INTERFACE
  const login = useCallback(async (email, password) => {
    /** Authenticate user and store JWT token. */
    const data = await apiLogin(email, password);
    if (data?.token) {
      setToken(data.token);
    }
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
    }
  }, []);

  const value = useMemo(() => ({
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout
  }), [token, login, register, logout]);

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
