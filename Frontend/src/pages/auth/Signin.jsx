import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeClosed } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { auth } from "../../contexts/Firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
  try {
    GoogleAuth.initialize({
      clientId:
        "740141742340-u1ila9q261spisi75680vlhaptp00kqg.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
  } catch {
    /* ignore duplicate init */
  }
}

function resolveReturnPath(props, location) {
  if (props?.from && typeof props.from === "string") return props.from;
  const raw = location?.state?.from;
  if (raw && typeof raw === "object" && raw.pathname != null) {
    const p = `${raw.pathname}${raw.search || ""}${raw.hash || ""}`;
    return p || "/";
  }
  if (typeof raw === "string" && raw.length) return raw;
  return "/";
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 Z"
        fill="#4285F4"
      />
      <path
        d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 Z"
        fill="#34A853"
      />
      <path
        d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 Z"
        fill="#FBBC05"
      />
      <path
        d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 Z"
        fill="#EA4335"
      />
    </svg>
  );
}

const Signin = (props) => {
  const { setUser } = useContext(AppContext);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = resolveReturnPath(props, location);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const e = {};
    const trimmed = email.trim();
    if (!trimmed) e.email = "Email is required";
    else if (!/^[\w.-]+@[\w.-]+\.[A-Z]{2,8}$/i.test(trimmed)) {
      e.email = "Enter a valid email address";
    }
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persistSession = (data) => {
    if (data?.token) {
      try {
        localStorage.setItem("token", data.token);
      } catch {
        /* ignore */
      }
    }
    if (data?.user) {
      setUser(data.user);
      try {
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch {
        /* ignore */
      }
    }
  };

  const finishGoogleSignin = async ({ email: gEmail, uuid, username, pp }) => {
    const res = await api.post("/api/auth/signinWithGoogle", {
      email: gEmail,
      uuid,
      username,
      pp,
      type: "google",
    });
    persistSession(res.data);
    toast({
      title: `Welcome back${res.data?.user?.username ? `, ${res.data.user.username}` : ""}!`,
      variant: "success",
    });
    navigate(returnPath, { replace: true });
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => {});
        const data = await GoogleAuth.signIn();
        await finishGoogleSignin({
          email: data.email,
          uuid: data.id,
          username: data.displayName,
          pp: data.imageUrl,
        });
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const p = result.user.providerData[0] || result.user;
        await finishGoogleSignin({
          email: p.email,
          uuid: p.uid,
          username: p.displayName,
          pp: p.photoURL,
        });
      }
    } catch (err) {
      const code = err?.response?.data?.code;
      const msg =
        code === "EMAIL_PASSWORD_ACCOUNT"
          ? "This email uses password sign-in. Sign in with your email and password."
          : err?.response?.data?.message ||
            "Google sign-in was cancelled or failed.";
      toast({
        title: "Google sign-in failed",
        description: msg,
        variant: "error",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post("/api/auth/signin", {
        email: email.trim(),
        password,
      });
      if (res.status === 200 && res.data?.user) {
        persistSession(res.data);
        toast({
          title: `Welcome back, ${res.data.user.username || "there"}!`,
          variant: "success",
        });
        navigate(returnPath, { replace: true });
      } else {
        toast({
          title: "Sign-in failed",
          description: res?.data?.message || "Invalid credentials.",
          variant: "error",
        });
      }
    } catch (err) {
      const code = err?.response?.data?.code;
      const msg =
        code === "USE_GOOGLE"
          ? "This account uses Google. Tap 'Continue with Google' below."
          : err?.response?.data?.message || "Invalid email or password.";
      toast({
        title: "Sign-in failed",
        description: msg,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formBody = (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Email" required error={errors.email}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: "" }));
            }}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {showPass ? (
                <Eye className="size-4" aria-hidden="true" />
              ) : (
                <EyeClosed className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            to="/pass-reset-mail"
            className="text-xs font-semibold text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="brand" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        loading={googleLoading}
        onClick={handleGoogleAuth}
        className="w-full"
      >
        <GoogleLogo />
        <span>Continue with Google</span>
      </Button>
    </div>
  );

  if (props.css) {
    return <div className="w-full">{formBody}</div>;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-md flex-col justify-center py-8">
      <Card className="shadow-card">
        <CardHeader className="text-center">
          <img
            src="/web-app-manifest-512x512.png"
            alt="Propatyc"
            width={48}
            height={48}
            className="mx-auto mb-2 size-12 rounded-2xl object-contain"
          />
          <CardTitle className="text-2xl font-extrabold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to request site visits, save homes, or manage listings.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {formBody}
          <p className="text-center text-xs text-muted-foreground">
            New to Propatyc?{" "}
            <Link
              to="/signup"
              state={location.state}
              className="font-semibold text-brand hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signin;
