import React, { useContext } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";

const AuthUser = () => {
  const { user, loading } = useContext(AppContext);
  const location = useLocation();
  return (
    <>
      {loading ? null : user ? (
        <Outlet />
      ) : (
        <Navigate
          to="/signup"
          state={{ from: location }}
          replace
        />
      )}
    </>
  );
};

export default AuthUser;
