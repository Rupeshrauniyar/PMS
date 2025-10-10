import React, { useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import Signup from "../pages/Signup";

const AuthUser = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(AppContext);
  useEffect(() => {
    if (!loading && !user?._id) {
      navigate("/signup", { replace: true });
    }
  }, [loading, user]);
  return <>{loading ? null : user ? <Outlet /> : null}</>;
};

export default AuthUser;
