import { Eye, EyeClosed, Loader2, Lock, Mail } from "lucide-react";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../contexts/AppContextx";
import axios from "axios";

import AlertBox from "../components/AlertBox";
// import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// import { auth } from "../contexts/Firebase";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
GoogleAuth.initialize({
  clientId:
    "740141742340-u1ila9q261spisi75680vlhaptp00kqg.apps.googleusercontent.com",
  scopes: ["profile", "email"],
  grantOfflineAccess: true,
});
const Signin = () => {
  const { setUser } = useContext(AppContext);
  const [showPass, setShowPass] = useState(false);
  const [fields, setFields] = useState([
    {
      name: "Email",
      type: "email",
      placeholder: "you@example.com",
      icon: <Mail size={20} />,
    },
    {
      name: "Password",
      type: "password",
      placeholder: "********",
      icon: <Lock size={20} />,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldData, setFieldData] = useState([]);
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState(null);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!fieldData.Email) {
      newErrors.Email = "Email is required";
    } else if (!fieldData.Email.trim()) {
      newErrors.Email = "Email cannot be empty";
    } else if (!/^[\w.-]+@[\w.-]+\.[A-Z]{2,4}$/i.test(fieldData.Email.trim())) {
      newErrors.Email = "Invalid email address";
    }
    if (!fieldData.Password) {
      newErrors.Password = "Password is required";
    } else if (!fieldData.Password.trim()) {
      newErrors.Password = "Password cannot be empty";
    } else if (fieldData.Password.length < 6) {
      newErrors.Password = "Password must be at least 6 characters long";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleGoogleAuth = async () => {
  //   const provider = new GoogleAuthProvider();
  //   const auth = getAuth();
  //   setGoogleLoading(true);
  //   signInWithPopup(auth, provider)
  //     .then(async (result) => {
  //       // console.log(result);
  //       await axios
  //         .post(
  //           `${import.meta.env.VITE_backendUrl}/api/auth/signinWithGoogle`,
  //           {
  //             email: result.user.providerData[0].email,
  //             uuid: result.user.providerData[0].uid,
  //             username: result.user.providerData[0].displayName,
  //             pp: result.user.providerData[0].photoURL,
  //             type: "google",
  //           }
  //         )
  //         .then((res) => {
  //           // console.log(res);
  //           setGoogleLoading(false);

  //           setUser(res.data.user);
  //           localStorage.setItem("token", res.data.token);
  //           localStorage.setItem("user", JSON.stringify(res.data.user));
  //           navigate("/");
  //         })
  //         .catch((err) => {
  //           setGoogleLoading(false);
  //           setBackendError("Google sign-in failed.");
  //         });
  //     })
  //     .catch((error) => {
  //       setGoogleLoading(false);
  //       setBackendError("Google sign-in failed.");
  //       // Handle Errors here.
  //       // console.log(error);
  //       // alert("Signup failed");
  //     });
  // };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      await GoogleAuth.signOut();
      const data = await GoogleAuth.signIn({});
      if (!data.idToken) {
        setGoogleLoading(false);

        setBackendError("Signin Failed due to token");
      }

      await axios
        .post(`${import.meta.env.VITE_backendUrl}/api/auth/signinWithGoogle`, {
          email: data.email,
          uuid: data.id,
          username: data.displayName,
          pp: data.imageUrl,
          type: "google",
        })
        .then((res) => {
          setGoogleLoading(false);

          setUser(res.data.user);
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          navigate("/");
        })
        .catch((err) => {
          setGoogleLoading(false);
          setBackendError("Google sign-in failed.");

          // alert(err);
          // alert("Signin failed");
        });
    } catch (err) {
      setGoogleLoading(false);
      setBackendError("Google sign-in failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    await axios
      .post(`${import.meta.env.VITE_backendUrl}/api/auth/signin`, {
        email: fieldData.Email,
        password: fieldData.Password,
      })
      .then((res) => {
        // console.log(res);
        if (res.status === 201) {
          setLoading(false);

          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("token", res.data.token);
          navigate("/");
        } else {
          setLoading(false);
          setBackendError(response?.data?.message || "Sign-in failed.");
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        setBackendError(err.response?.data?.message || "Sign-in failed.");
        // navigate("/signin");
      });
  };
  return (
    <>
      <div className="w-full min-h-screen flex items-center justify-center xl:bg-gradient-to-br from-zinc-50 to-zinc-100 xl:px-4 px:2">
        <div className="w-full xl:max-w-md xl:backdrop-blur-xl xl:border xl:border-zinc-200/60 xl:shadow-xl xl:rounded-2xl xl:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Sign in to continue</p>
          </div>
          {backendError && (
            <AlertBox
              message={backendError}
              type="error"
              onClose={() => setBackendError(null)}
            />
          )}
          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  className="w-full"
                  key={index}
                >
                  <label
                    htmlFor={field.name}
                    className="flex items-center text-sm font-medium text-zinc-700"
                  >
                    {field.name}
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs ml-1 font-medium ">
                        ({errors[field.name]})
                      </p>
                    )}
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute z-10 left-4 top-1/2 -translate-y-1/2  text-gray-400 pointer-events-none">
                      {field.icon}
                    </span>

                    <input
                      id={field.name}
                      name={field.name}
                      type={
                        field.name === "Password"
                          ? showPass
                            ? "text"
                            : "password"
                          : field.type
                      }
                      value={
                        fieldData[field?.name]?.length > 0
                          ? fieldData[field.name]
                          : ""
                      }
                      autoComplete={field.type}
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          setFieldData((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            [field.name]: "",
                          }));
                        } else {
                          setFieldData((prev) => ({
                            ...prev,
                            [field.name]: "",
                          }));
                        }
                      }}
                      className={`w-full py-3 pl-12 pr-4 rounded-xl border ${
                        errors[field.name]
                          ? "border-red-500"
                          : "border-gray-200"
                      } bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-zinc-200 focus:outline-none transition-all`}
                      placeholder={field.placeholder}
                    />
                    {field.name === "Password" ? (
                      <>
                        {showPass ? (
                          <Eye
                            onClick={() => setShowPass(false)}
                            className="absolute z-20 right-4 top-1/2 -translate-y-1/2 text-gray-400 "
                            size={20}
                          />
                        ) : (
                          <EyeClosed
                            onClick={() => setShowPass(true)}
                            className="absolute z-20  top-1/2 right-4 -translate-y-1/2 text-gray-400 "
                            size={20}
                          />
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-right text-sm text-zinc-600">
                <span>Forgot password? </span>
                <Link
                  to="/pass-reset-mail"
                  className="text-zinc-900 font-medium hover:underline"
                >
                  click here
                </Link>
              </div>
              <button
                disabled={loading ? true : false}
                type="submit"
                className={`w-full ${
                  loading ? "bg-zinc-600" : "bg-zinc-900"
                } hover:bg-zinc-800 text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center justify-center`}
              >
                {loading ? (
                  <Loader2
                    size={18}
                    className="animate-spin ml-1"
                  />
                ) : (
                  <>Sign in</>
                )}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-zinc-200 w-full"></div>
                <span className="text-xs text-zinc-500">or</span>
                <div className="h-px bg-zinc-200 w-full"></div>
              </div>
            </div>
          </form>

          <button
            disabled={googleLoading ? true : false}
            onClick={handleGoogleAuth}
            className={`w-full border ${
              googleLoading ? "bg-zinc-200" : ""
            } border-zinc-200 rounded-xl px-6 py-3 hover:bg-zinc-50 focus:bg-zinc-50 transition-colors flex items-center justify-center gap-3`}
          >
            {googleLoading ? (
              <Loader2
                size={18}
                className="animate-spin ml-1"
              />
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                >
                  <g
                    id="logo_googleg_48dp"
                    transform="translate(0, 0)"
                  >
                    <path
                      d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 L17.64,9.20454545 Z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 L9,18 Z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 L3.96409091,10.71 Z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 L9,3.57954545 Z"
                      fill="#EA4335"
                    ></path>
                  </g>
                </svg>
                <span className="text-sm font-medium text-zinc-700 flex items-center justify-center">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          <div className="text-center text-sm text-zinc-600">
            <span>Create an account? </span>
            <Link
              to="/signup"
              className="text-zinc-900 font-medium hover:underline"
            >
              Signup
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signin;
