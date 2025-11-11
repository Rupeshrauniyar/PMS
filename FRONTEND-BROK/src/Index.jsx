import React, { lazy, Suspense, useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { PushNotifications } from "@capacitor/push-notifications";
import axios from "axios";
import { AppContext } from "./contexts/AppContextx";
import { App as CapacitorApp } from "@capacitor/app";
import Navbar from "./components/Navbar";
const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PassResetMail = lazy(() => import("./pages/PassResetMail"));
const Search = lazy(() => import("./pages/Search"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Signin = lazy(() => import("./pages/Signin"));
const Signup = lazy(() => import("./pages/Signup"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const View = lazy(() => import("./pages/View"));
const Book = lazy(() => import("./pages/Book"));
const MyProp = lazy(() => import("./pages/MyProp"));
const BookedProp = lazy(() => import("./pages/BookedProp"));
const AuthUser = lazy(() => import("./middlewares/AuthUser"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Index = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect(() => {
  //   console.log("Trying FCM");
  //   const token = localStorage.getItem("token");
  //   console.log("your-token", token);
  //   console.log("your-fcm-token", localStorage.getItem("fcmToken"));

  //   const checkPermission = async () => {
  //     let permStatus = await PushNotifications.checkPermissions();
  //     if (permStatus.receive !== "granted") {
  //       permStatus = await PushNotifications.requestPermissions();
  //     }
  //     return permStatus.receive === "granted";
  //   };

  //   if (token?.length > 0) {
  //     const getFCMToken = () => {
  //       return new Promise((resolve, reject) => {
  //         const timeout = setTimeout(() => {
  //           reject(new Error("FCM token timeout"));
  //         }, 10000); // 10 second timeout

  //         PushNotifications.addListener("registration", (tokenData) => {
  //           clearTimeout(timeout);
  //           resolve(tokenData.value);
  //         });

  //         PushNotifications.addListener("registrationError", (error) => {
  //           console.log("FCM ERROR", error);
  //           clearTimeout(timeout);
  //           reject(error);
  //         });

  //         PushNotifications.register();
  //       });
  //     };
  //     const tryIt = async () => {
  //       try {
  //         const granted = await checkPermission();
  //         if (!granted)
  //           return console.warn("Push notifications permission not granted");
  //         const token = await getFCMToken();
  //         // if (token === localStorage.getItem("fcmToken")) return;
  //         console.log("FCM Token:", token);
  //         // const token = "njdjndhsbbj"
  //         localStorage.setItem("fcmToken", token);
  //         await axios.post(
  //           `${import.meta.env.VITE_backendUrl}/api/auth/update-fcm-token`,
  //           {
  //             fcmToken: token,
  //             token: localStorage.getItem("token"),
  //           }
  //         );
  //       } catch (err) {
  //         console.error("Failed to get FCM token:", err.message);
  //       }
  //     };
  //     tryIt();
  //   } else {
  //     console.log("No token available");
  //   }
  // }, [user]);

  // useEffect(() => {
  //   // Listen for hardware back button
  //   const backHandler = CapacitorApp.addListener("backButton", (event) => {
  //     // If not on the root, go back
  //     if (location.pathname !== "/") {
  //       navigate(-1);
  //     } else {
  //       // On root, exit the app
  //       CapacitorApp.exitApp();
  //     }
  //   });
  //   return () => {
  //     backHandler.remove && backHandler.remove();
  //   };
  // }, [location.pathname, navigate]);

  if (location.pathname === "/landing") {
    return <Landing />;
  }
  function useScrollTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
  }
  useScrollTop();
  return (
    <>
      <Navbar />
      <div
        className={`${
          location.pathname === "/signin" || location.pathname === "/signup"
            ? "w-full min-h-screen"
            : "xl:w-[40%] xl:ml-[33%] ml-0"
        } min-h-screen text-black px-2`}
      >
        <Suspense>
          <Routes>
            <Route element={<AuthUser />}>
              <Route
                path="/add-property"
                element={<AddProperty />}
              />
              <Route
                path="/profile"
                element={<Profile />}
              />
              <Route
                path="/edit-profile"
                element={<EditProfile />}
              />
              <Route
                path="/my/:id"
                element={<MyProp />}
              />
              <Route
                path="/booked/:id"
                element={<BookedProp />}
              />
              <Route
                path="/change-password"
                element={<ChangePassword />}
              />
              <Route
                path="/"
                element={<Home />}
              />
              <Route
                path="/landing"
                element={<Landing />}
              />
              <Route
                path="/search"
                element={<Search />}
              />
              <Route
                path="/settings"
                element={<Settings />}
              />
              <Route
                path="*"
                element={<NotFound />}
              />
            </Route>

            <Route
              path="/forgot-password/:token"
              element={<ForgotPassword />}
            />
            <Route
              path="/pass-reset-mail"
              element={<PassResetMail />}
            />

            <Route
              path="/signin"
              element={<Signin />}
            />
            <Route
              path="/signup"
              element={<Signup />}
            />
          </Routes>
        </Suspense>
      </div>
    </>
  );
};

export default Index;
