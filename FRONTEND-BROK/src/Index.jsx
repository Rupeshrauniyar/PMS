import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import AuthUser, { SuperbrokerRoute } from "@/middlewares/AuthUser";
import { BrokerShell } from "@/components/broker/BrokerShell";
import { PageTransition } from "@/components/ui/page-transition";
import { useNativeBridge } from "@/hooks/useNativeBridge";

const Dashboard = lazy(() => import("@/pages/broker/Dashboard"));
const Pool = lazy(() => import("@/pages/broker/Pool"));
const MyVisits = lazy(() => import("@/pages/broker/MyVisits"));
const VisitDetail = lazy(() => import("@/pages/broker/VisitDetail"));
const Calendar = lazy(() => import("@/pages/broker/Calendar"));
const AllVisits = lazy(() => import("@/pages/broker/AllVisits"));
const Notifications = lazy(() => import("@/pages/broker/Notifications"));

const Profile = lazy(() => import("@/pages/account/Profile"));
const EditProfile = lazy(() => import("@/pages/auth/EditProfile"));
const ChangePassword = lazy(() => import("@/pages/auth/ChangePassword"));

const Signin = lazy(() => import("@/pages/auth/Signin"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const PassResetMail = lazy(() => import("@/pages/auth/PassResetMail"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));

const Settings = lazy(() => import("@/pages/settings/Settings"));
const Themes = lazy(() => import("@/pages/Themes"));
const Intro = lazy(() => import("@/pages/Intro"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const NotFound = lazy(() => import("@/pages/settings/NotFound"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50svh] w-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

const Index = () => {
  const location = useLocation();
  useNativeBridge();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <BrokerShell>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              {/* Protected Broker Console Routes */}
              <Route element={<AuthUser />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pool" element={<Pool />} />
                <Route path="/visits" element={<MyVisits />} />
                <Route path="/visits/:id" element={<VisitDetail />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route
                  path="/all"
                  element={
                    <SuperbrokerRoute>
                      <AllVisits />
                    </SuperbrokerRoute>
                  }
                />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/change-password" element={<ChangePassword />} />
              </Route>

              {/* Auth & Public Portal Routes */}
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pass-reset-mail" element={<PassResetMail />} />
              <Route path="/forgot-password/:token" element={<ForgotPassword />} />

              <Route path="/settings" element={<Settings />} />
              <Route path="/themes" element={<Themes />} />
              <Route path="/intro" element={<Intro />} />
              <Route path="/termsandcondition" element={<Terms />} />
              <Route path="/privacyandpolicy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </Suspense>
    </BrokerShell>
  );
};

export default Index;
