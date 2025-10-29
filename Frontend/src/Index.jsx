import React, { lazy, Suspense, useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AppContext } from "./contexts/AppContextx";
const Home = lazy(() => import("./pages/Home"));
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
  // const { user } = useContext(AppContext);
  // useEffect(() => {
  //   if (localStorage.getItem("token")) {
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
  //           clearTimeout(timeout);
  //           reject(error);
  //         });

  //         PushNotifications.register();
  //       });
  //     };
  //     const tryIt = async () => {
  //       try {
  //         const token = await getFCMToken();
  //         if (token === localStorage.getItem("fcmToken")) return;
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

  const location = useLocation();
  return (
    <div
      className={`${
        location.pathname === "/signin" || location.pathname === "/signup"
          ? "w-full"
          : "xl:w-[80%] xl:ml-[20%] ml-0"
      } min-h-screen text-black`}
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
          </Route>
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/search"
            element={<Search />}
          />
          <Route
            path="/forgot-password/:token"
            element={<ForgotPassword />}
          />
          <Route
            path="/pass-reset-mail"
            element={<PassResetMail />}
          />
          <Route
            path="/view/:id"
            element={<View />}
          />
          <Route
            path="/book/:id/:price"
            element={<Book />}
          />
          <Route
            path="/settings"
            element={<Settings />}
          />
          <Route
            path="*"
            element={<NotFound />}
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
  );
};

export default Index;
