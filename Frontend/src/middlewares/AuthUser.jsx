import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppContext } from "../contexts/AppContext";

const AuthUser = () => {
  const { user, loading } = useContext(AppContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50svh] w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Checking authentication…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AuthUser;
