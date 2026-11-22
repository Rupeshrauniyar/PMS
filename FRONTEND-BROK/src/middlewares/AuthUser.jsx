import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";

export function SuperbrokerRoute({ children }) {
  const { user, loading, isSuperbroker } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60svh] w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
        <span className="sr-only">Checking broker session</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname + location.search }} replace />;
  }

  if (!isSuperbroker) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}

const AuthUser = () => {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60svh] w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
        <span className="sr-only">Checking broker session</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/signin"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default AuthUser;
