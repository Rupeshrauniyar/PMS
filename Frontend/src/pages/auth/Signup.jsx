import { Lock, Mail, User, Eye, EyeClosed, Loader2 } from "lucide-react";
import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import AlertBox from "../../components/AlertBox";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../contexts/Firebase";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

GoogleAuth.initialize({
  clientId: "740141742340-u1ila9q261spisi75680vlhaptp00kqg.apps.googleusercontent.com",
  scopes: ["profile", "email"],
  grantOfflineAccess: true,
});

const Signup = (props) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const location = useLocation();
  const from = props?.from ? props.from : location?.state?.from || "/";
  const [fieldData, setFieldData] = useState({});

  const fields = [
    { name: "Email", type: "email", placeholder: "you@example.com", icon: <Mail size={15} /> },
    { name: "Username", type: "text", placeholder: "John Doe", icon: <User size={15} /> },
    { name: "Password", type: "password", placeholder: "••••••••", icon: <Lock size={15} /> },
  ];

  // ── Sends user data to your backend regardless of how we got it ──
  const finishGoogleSignin = async ({ email, uuid, username, pp }) => {
    const res = await api.post("/api/auth/signinWithGoogle", {
      email,
      uuid,
      username,
      pp,
      type: "google",
    });
    setUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    navigate(from);
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // ── Native (Android/iOS): use Capacitor plugin ──
        await GoogleAuth.signOut().catch(() => {});
        const data = await GoogleAuth.signIn();
        await finishGoogleSignin({
          email: data.email,
          uuid: data.id,
          username: data.displayName,
          pp: data.imageUrl,
        });
      } else {
        // ── Web: use Firebase popup ──
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const p = result.user.providerData[0];
        await finishGoogleSignin({
          email: p.email,
          uuid: p.uid,
          username: p.displayName,
          pp: p.photoURL,
        });
      }
    } catch (err) {
      console.error("[Google Sign-up]", err);
      setBackendError("Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!fieldData.Email?.trim()) {
      newErrors.Email = "Required";
    } else if (!/^[\w.-]+@[\w.-]+\.[A-Z]{2,4}$/i.test(fieldData.Email.trim())) {
      newErrors.Email = "Invalid email";
    }
    if (!fieldData.Username?.trim()) newErrors.Username = "Required";
    if (!fieldData.Password?.trim()) {
      newErrors.Password = "Required";
    } else if (fieldData.Password.length < 6) {
      newErrors.Password = "Min 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await api
      .post("/api/auth/signup", {
        email: fieldData.Email,
        password: fieldData.Password,
        username: fieldData.Username,
      })
      .then((res) => {
        if (res.status === 200) {
          setLoading(false);
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          navigate(from);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setLoading(false);
        setBackendError(err?.response?.data?.message || "Sign-up failed.");
      });
  };

  const GoogleSVG = () => (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 Z" fill="#4285F4" />
      <path d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 Z" fill="#34A853" />
      <path d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 Z" fill="#FBBC05" />
      <path d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 Z" fill="#EA4335" />
    </svg>
  );

  const formContent = (
    <>
      {backendError && (
        <AlertBox message={backendError} type="error" onClose={() => setBackendError(null)} />
      )}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        {fields.map((field) => (
          <div key={field.name}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500">
                {field.name}
              </label>
              {errors[field.name] && (
                <span className="text-[11px] text-red-500 font-medium">{errors[field.name]}</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                {field.icon}
              </span>
              <input
                id={field.name}
                name={field.name}
                type={field.name === "Password" ? (showPass ? "text" : "password") : field.type}
                autoComplete={field.type}
                onChange={(e) => {
                  setFieldData((prev) => ({ ...prev, [field.name]: e.target.value.trim() ? e.target.value : "" }));
                  setErrors((prev) => ({ ...prev, [field.name]: "" }));
                }}
                placeholder={field.placeholder}
                className={`w-full py-2 pl-9 pr-9 rounded-lg border text-sm bg-white outline-none focus:ring-2 focus:ring-black focus:border-black transition-all ${errors[field.name] ? "border-red-400" : "border-zinc-200"}`}
              />
              {field.name === "Password" && (
                <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showPass ? <Eye size={15} /> : <EyeClosed size={15} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <button disabled={loading} type="submit" className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-60 active:scale-[0.98] transition-all mt-1">
          {loading ? <Loader2 size={15} className="animate-spin" /> : "Create Account"}
        </button>
      </form>

      <div className="flex items-center gap-2 my-3">
        <div className="h-px bg-zinc-100 flex-1" />
        <span className="text-[11px] text-zinc-400">or</span>
        <div className="h-px bg-zinc-100 flex-1" />
      </div>

      <button disabled={googleLoading} onClick={handleGoogleAuth} className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 mb-3 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
        {googleLoading ? (
          <><Loader2 size={15} className="animate-spin text-zinc-400" /><span className="text-xs text-zinc-400">Signing in…</span></>
        ) : (
          <><GoogleSVG /><span className="text-xs font-medium text-zinc-600">Continue with Google</span></>
        )}
      </button>
    </>
  );

  if (props.css) return <div className="w-full">{formContent}</div>;

  return (
    <div className="w-full h-screen p-2 flex items-center justify-center xl:px-4">
      <div className="w-full xl:max-w-md xl:backdrop-blur-xl xl:border xl:border-zinc-200/60 xl:shadow-xl xl:rounded-2xl xl:p-8">
        {formContent}
        <p className="text-center text-xs text-zinc-500 mt-2">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-zinc-800 hover:text-black transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;