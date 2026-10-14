import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const PUBLIC_AUTH_ENDPOINTS = ['/customers/me', '/customers/login', '/customers/register'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/customers/me');
      setUser(data);
      setStatus('authenticated');
      return data;
    } catch {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // If the JWT cookie expires mid-session, any protected call returns 401 → sign out locally
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url ?? '';
        if (error.response?.status === 401 && !PUBLIC_AUTH_ENDPOINTS.some((path) => url.includes(path))) {
          setUser(null);
          setStatus('unauthenticated');
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = useCallback(
    async (email, password) => {
      await api.post('/customers/login', { email, password });
      return refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/customers/logout');
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, logout, refreshUser }),
    [user, status, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
