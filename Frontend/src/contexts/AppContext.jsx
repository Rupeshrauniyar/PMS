import React, { createContext, useEffect, useState } from "react";
import api, { clearAuthTokens } from "../api/client";

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.get("/api/auth/checkAuth");
      if (response.status === 200 && response.data?.success) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        setUser(null);
        localStorage.removeItem("user");
        clearAuthTokens();
      }
    } catch (err) {
      // Keep cached session on transient offline startup; clear only on 401/403
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setUser(null);
        localStorage.removeItem("user");
        clearAuthTokens();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
