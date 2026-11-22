import React, { lazy, Suspense, useContext, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PushNotifications } from "@capacitor/push-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Loader2 } from "lucide-react";

import { AppContext } from "./contexts/AppContext";
import api from "./api/client";
import { universalLinkToAppPath } from "./utils/propertyShare";
import { resolveNotificationTarget } from "./utils/notificationRoutes";
import { closeTopOverlay } from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/page-transition";
import Navbar, { shouldHideChrome } from "./components/Navbar";

import Intro from "./pages/Intro";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Themes from "./pages/Themes";
import PayFailure from "./pages/book/PayFailure";
import PaySuccess from "./pages/book/PaySuccess";

const Home = lazy(() => import("@/pages/user/Home"));
const Search = lazy(() => import("@/pages/user/Search"));
const Notifications = lazy(() => import("@/pages/user/Notifications"));
const Profile = lazy(() => import("@/pages/user/Profile"));
const Visits = lazy(() => import("@/pages/visits/Visits"));
const VisitDetail = lazy(() => import("@/pages/visits/VisitDetail"));

const ChangePassword = lazy(() => import("@/pages/auth/ChangePassword"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const PassResetMail = lazy(() => import("@/pages/auth/PassResetMail"));
const EditProfile = lazy(() => import("@/pages/auth/EditProfile"));
const Signin = lazy(() => import("@/pages/auth/Signin"));
const Signup = lazy(() => import("@/pages/auth/Signup"));

const AddProperty = lazy(() => import("@/pages/prop/AddProperty"));
const EditProperty = lazy(() => import("@/pages/prop/EditProperty"));
const View = lazy(() => import("@/pages/prop/View"));
const MyProp = lazy(() => import("@/pages/prop/MyProp"));

const Book = lazy(() => import("@/pages/book/Book"));
const Bookings = lazy(() => import("@/pages/book/Bookings"));
const BookedProp = lazy(() => import("@/pages/book/BookedProp"));
const Pay = lazy(() => import("@/pages/book/Pay"));

const Settings = lazy(() => import("@/pages/settings/Settings"));
const NotFound = lazy(() => import("@/pages/settings/NotFound"));
const AuthUser = lazy(() => import("@/middlewares/AuthUser"));

function RouteFallback() {
  return (
    <div className="flex min-h-[45svh] w-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

const Index = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const userRef = useRef(user);
  userRef.current = user;

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Native FCM registration & notification tap routing (guarded + cleaned up)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user?._id) {
      return undefined;
    }

    let cancelled = false;
    const handles = [];

    const setupPush = async () => {
      try {
        const regHandle = await PushNotifications.addListener(
          "registration",
          async (tokenData) => {
            if (cancelled || !tokenData?.value) return;
            try {
              const nextToken = tokenData.value;
              localStorage.setItem("fcmToken", nextToken);
              await api.post("/api/auth/update-fcm-token", {
                fcmToken: nextToken,
              });
            } catch {
              /* non-fatal */
            }
          },
        );
        handles.push(regHandle);

        const errHandle = await PushNotifications.addListener(
          "registrationError",
          () => {
            /* non-fatal push registration failure */
          },
        );
        handles.push(errHandle);

        const actionHandle = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            if (cancelled) return;
            try {
              const data = action?.notification?.data || {};
              const target = resolveNotificationTarget(data, userRef.current);
              if (target) navigate(target);
            } catch {
              /* ignore malformed payload */
            }
          },
        );
        handles.push(actionHandle);

        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== "granted") {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive === "granted" && !cancelled) {
          await PushNotifications.register();
        }
      } catch {
        /* push plugin unavailable or denied — never crash */
      }
    };

    setupPush();

    return () => {
      cancelled = true;
      for (const h of handles) {
        try {
          h?.remove?.();
        } catch {
          /* ignore */
        }
      }
    };
  }, [user?._id, navigate]);

  // Hardware back button: close open Dialog/Sheet first, else history back, else exit
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const handlePromise = CapacitorApp.addListener("backButton", () => {
      if (closeTopOverlay()) return;
      if (pathnameRef.current !== "/") {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      handlePromise.then((h) => h?.remove?.()).catch(() => {});
    };
  }, [navigate]);

  // Android / iOS Universal Links
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const openUrl = (url) => {
      const path = universalLinkToAppPath(url);
      if (!path) return;
      navigate(path, { replace: true });
    };

    let cancelled = false;
    const listenerPromise = (async () => {
      try {
        const launch = await CapacitorApp.getLaunchUrl();
        if (!cancelled && launch?.url) openUrl(launch.url);
      } catch {
        /* no cold-start URL */
      }
      return CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        openUrl(url);
      });
    })();

    return () => {
      cancelled = true;
      listenerPromise.then((h) => h?.remove?.()).catch(() => {});
    };
  }, [navigate]);

  if (location.pathname === "/landing") {
    return <Navigate to="/" replace />;
  }

  const noChrome = shouldHideChrome(location.pathname);

  return (
    <>
      <Navbar />
      <main
        className={
          noChrome
            ? "app-main no-chrome min-h-svh w-full"
            : "app-main min-h-svh w-full"
        }
      >
        <div
          className={
            noChrome
              ? "w-full"
              : "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
          }
        >
          <Suspense fallback={<RouteFallback />}>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                <Routes location={location}>
                  <Route element={<AuthUser />}>
                    <Route path="/add-property" element={<AddProperty />} />
                    <Route path="/edit-property/:id" element={<EditProperty />} />
                    <Route path="/my/:id" element={<MyProp />} />
                    <Route path="/visits" element={<Visits />} />
                    <Route path="/visits/:id" element={<VisitDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/booked/:id" element={<BookedProp />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/pay/:id/:price" element={<Pay />} />
                    <Route path="/payment-success" element={<PaySuccess />} />
                    <Route path="/payment-failure" element={<PayFailure />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                  </Route>

                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/view/:id" element={<View />} />
                  <Route path="/book/:id/:price" element={<Book />} />

                  <Route path="/signin" element={<Signin />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/forgot-password/:token"
                    element={<ForgotPassword />}
                  />
                  <Route path="/pass-reset-mail" element={<PassResetMail />} />

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
        </div>
      </main>
    </>
  );
};

export default Index;
