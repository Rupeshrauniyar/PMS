import React, { lazy, Suspense, useContext, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useMatch,
  Navigate,
} from "react-router-dom";
import { PushNotifications } from "@capacitor/push-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import { AppContext } from "./contexts/AppContext";
import { universalLinkToAppPath } from "./utils/propertyShare";
import Navbar from "./components/Navbar";
import Intro from "./pages/Intro";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Themes from "./pages/Themes";
import PayFailure from "./pages/book/PayFailure";
import PaySuccess from "./pages/book/PaySuccess";
// import Pay from "./pages/book/Pay";
const Home = lazy(() => import("@/pages/user/Home"));

const ChangePassword = lazy(() => import("@/pages/auth/ChangePassword"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const PassResetMail = lazy(() => import("@/pages/auth/PassResetMail"));
const EditProfile = lazy(() => import("@/pages/auth/EditProfile"));
const Signin = lazy(() => import("@/pages/auth/Signin"));
const Signup = lazy(() => import("@/pages/auth/Signup"));

const Search = lazy(() => import("@/pages/user/Search"));
const Notifications = lazy(() => import("@/pages/user/Notifications"));
// const Reel = lazy(() => import("@/pages/user/Reels"));
const Profile = lazy(() => import("@/pages/user/Profile"));

const AddProperty = lazy(() => import("@/pages/prop/AddProperty"));
const View = lazy(() => import("@/pages/prop/View"));
const MyProp = lazy(() => import("@/pages/prop/MyProp"));

const Book = lazy(() => import("@/pages/book/Book"));
const Bookings = lazy(() => import("@/pages/book/Bookings"));

const BookedProp = lazy(() => import("@/pages/book/BookedProp"));
const Pay = lazy(() => import("@/pages/book/Pay"));

const Settings = lazy(() => import("@/pages/settings/Settings"));
const NotFound = lazy(() => import("@/pages/settings/NotFound"));

const AuthUser = lazy(() => import("@/middlewares/AuthUser"));

const Index = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Trying FCM");
    const token = localStorage.getItem("token");
    console.log("your-token", token);
    console.log("your-fcm-token", localStorage.getItem("fcmToken"));

    const checkPermission = async () => {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== "granted") {
        permStatus = await PushNotifications.requestPermissions();
      }
      return permStatus.receive === "granted";
    };

    if (token?.length > 0) {
      const getFCMToken = () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("FCM token timeout"));
          }, 10000); // 10 second timeout

          PushNotifications.addListener("registration", (tokenData) => {
            clearTimeout(timeout);
            resolve(tokenData.value);
          });

          PushNotifications.addListener("registrationError", (error) => {
            console.log("FCM ERROR", error);
            clearTimeout(timeout);
            reject(error);
          });

          PushNotifications.register();
        });
      };
      const tryIt = async () => {
        try {
          const granted = await checkPermission();
          if (!granted)
            return console.warn("Push notifications permission not granted");
          const token = await getFCMToken();
          // if (token === localStorage.getItem("fcmToken")) return;
          console.log("FCM Token:", token);
          // const token = "njdjndhsbbj"
          localStorage.setItem("fcmToken", token);
          await axios.post(
            `${import.meta.env.VITE_backendUrl}/api/auth/update-fcm-token`,
            {
              fcmToken: token,
              token: localStorage.getItem("token"),
            },
          );
        } catch (err) {
          console.error("Failed to get FCM token:", err.message);
        }
      };
      tryIt();
    } else {
      console.log("No token available");
    }
  }, [user]);

  useEffect(() => {
    // Listen for hardware back button
    const backHandler = CapacitorApp.addListener("backButton", (event) => {
      // If not on the root, go back
      if (location.pathname !== "/") {
        navigate(-1);
      } else {
        // On root, exit the app
        CapacitorApp.exitApp();
      }
    });
    return () => {
      backHandler.remove && backHandler.remove();
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

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
      } catch (_) {
        /* no cold-start URL */
      }
      return CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        openUrl(url);
      });
    })();

    return () => {
      cancelled = true;
      listenerPromise.then((h) => h.remove()).catch(() => {});
    };
  }, [navigate]);

  if (location.pathname === "/landing") {
    return <Navigate to="/" replace />;
  }
  function useScrollTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
  }
  useScrollTop();
  const isBookPage = useMatch("/book/:id/:price");

  return (
    <>
      <Navbar />
      <div
        className={`${
          location.pathname === "/signin" ||
          location.pathname === "/signup" ||
          location.pathname === "/reels" ||
          location.pathname === "/intro" ||
          location.pathname.includes("/view") ||
          isBookPage
            ? "w-full min-h-svh"
            : "xl:w-[40%] xl:ml-[33%] ml-0 px-2"
        } min-h-svh bg-background text-foreground `}
      >
        <Suspense>
          <Routes>
            <Route element={<AuthUser />}>
              <Route path="/add-property" element={<AddProperty />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/my/:id" element={<MyProp />} />
              <Route path="/booked/:id" element={<BookedProp />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/pay/:id/:price" element={<Pay />} />
              <Route path="/payment-success" element={<PaySuccess />} />
              <Route path="/payment-failure" element={<PayFailure />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>
            <Route path="/intro" element={<Intro />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/termsandcondition" element={<Terms />} />
            <Route path="/privacyandpolicy" element={<Privacy />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/" element={<Home />} />

            {/* <Route
              path="/reels"
              element={<Reel />}
            /> */}

            <Route path="/search" element={<Search />} />
            <Route
              path="/forgot-password/:token"
              element={<ForgotPassword />}
            />
            <Route path="/pass-reset-mail" element={<PassResetMail />} />
            <Route path="/view/:id" element={<View />} />
            <Route path="/book/:id/:price" element={<Book />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
};

export default Index;
