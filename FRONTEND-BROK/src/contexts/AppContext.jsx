import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/broker";
import { UNAUTHORIZED_EVENT, clearBrokerTokens } from "../api/client";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  const [user, setUserState] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((next) => {
    setUserState(next);
    if (next) localStorage.setItem("user", JSON.stringify(next));
    else localStorage.removeItem("user");
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authApi.checkAuth();
      setUser(res?.success ? res.user : null);
    } catch (err) {
      // Keep the cached user on network failure (offline start); drop it on 401.
      if (err?.response) {
        clearBrokerTokens();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [setUser]);

  const signOut = useCallback(async () => {
    try {
      await authApi.signout({ fcmToken: localStorage.getItem("fcmToken") || undefined });
    } catch {
      // ignore — we clear the local session regardless
    }
    localStorage.removeItem("fcmToken");
    clearBrokerTokens();
    setUser(null);
  }, [setUser]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      setLoading,
      refreshUser: checkAuth,
      signOut,
      isSuperbroker: user?.role === "superbroker",
    }),
    [user, setUser, loading, checkAuth, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
