import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
export const AppContext = createContext(null);
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setAuthenticated(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_backendUrl}/api/auth/checkAuth`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setLoading(false);
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      console.log("Validation false");
      if (err.response?.data?.success === false) {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
