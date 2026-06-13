import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [accessToken,  setAccessToken]  = useState(() => localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [loading,      setLoading]      = useState(true);  // initial auth check

  // ── Persist tokens ──────────────────────────────────────
  const saveTokens = (at, rt) => {
    setAccessToken(at);
    setRefreshToken(rt);
    localStorage.setItem('accessToken', at);
    if (rt) localStorage.setItem('refreshToken', rt);
  };

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // ── Fetch /auth/me with current token ─────────────────────
  const fetchMe = useCallback(async (token) => {
    try {
      const { data } = await axios.get(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data.data);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Silent refresh ────────────────────────────────────────
  const doRefresh = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return false;
    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt });
      const { accessToken: at, refreshToken: newRt } = data.data;
      saveTokens(at, newRt);
      await fetchMe(at);
      return at;
    } catch {
      clearTokens();
      return false;
    }
  }, [fetchMe]);

  // ── Boot: check existing token ────────────────────────────
  useEffect(() => {
    (async () => {
      const at = localStorage.getItem('accessToken');
      if (at) {
        const ok = await fetchMe(at);
        if (!ok) await doRefresh();
      }
      setLoading(false);
    })();
  }, [fetchMe, doRefresh]);

  // ── Axios interceptor: attach token + auto-refresh on 401 ─
  useEffect(() => {
    const reqId = axios.interceptors.request.use(cfg => {
      const at = localStorage.getItem('accessToken');
      if (at && cfg.url?.includes(BASE)) {
        cfg.headers.Authorization = `Bearer ${at}`;
      }
      return cfg;
    });

    const resId = axios.interceptors.response.use(
      res => res,
      async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          const newAt = await doRefresh();
          if (newAt) {
            original.headers.Authorization = `Bearer ${newAt}`;
            return axios(original);
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, [doRefresh]);

  // ── signup (public, always viewer role) ───────────────────
  const signup = async (name, email, password) => {
    const { data } = await axios.post(`${BASE}/auth/signup`, { name, email, password });
    const { user: u, accessToken: at, refreshToken: rt } = data.data;
    saveTokens(at, rt);
    setUser(u);
    return u;
  };

  // ── login ─────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await axios.post(`${BASE}/auth/login`, { email, password });
    const { user: u, accessToken: at, refreshToken: rt } = data.data;
    saveTokens(at, rt);
    setUser(u);
    return u;
  };

  // ── logout ────────────────────────────────────────────────
  const logout = async () => {
    try {
      await axios.post(`${BASE}/auth/logout`, { refreshToken });
    } catch {}
    clearTokens();
  };

  // ── register (admin only) ─────────────────────────────────
  const register = async (payload) => {
    const { data } = await axios.post(`${BASE}/auth/register`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.data;
  };

  // ── role helpers ──────────────────────────────────────────
  const isAdmin   = user?.role === 'admin';
  const isManager = ['admin','manager'].includes(user?.role);

  return (
    <AuthContext.Provider value={{
      user, accessToken, loading,
      login, logout, register, signup,
      isAdmin, isManager,
      refreshUser: () => fetchMe(accessToken),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);