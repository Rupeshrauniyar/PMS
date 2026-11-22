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
    /* ignore */
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

const Signup = (props) => {
  const { setUser } = useContext(AppContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = resolveReturnPath(props, location);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const finishGoogleSignin = async ({ email: gEmail, uuid, username: gName, pp, idToken }) => {
    const res = await api.post("/api/auth/signinWithGoogle", {
      email: gEmail,
      uuid,
      username: gName,
      pp,
      idToken,
      type: "google",
    });
    persistSession(res.data);
    toast({
      title: "Signed in with Google",
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
          username: data.displayName || data.givenName,
          pp: data.imageUrl,
          idToken: data.authentication?.idToken,
        });
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken().catch(() => undefined);
        const p = result.user.providerData[0] || result.user;
        await finishGoogleSignin({
          email: p.email,
          uuid: p.uid,
          username: p.displayName,
          pp: p.photoURL,
          idToken,
        });
      }
    } catch (err) {
      toast({
        title: "Google sign-up failed",
        description:
          err?.response?.data?.message || "Please try again or sign up with email.",
        variant: "error",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Full name is required";
    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = "Email is required";
    else if (!/^[\w.-]+@[\w.-]+\.[A-Z]{2,8}$/i.test(trimmedEmail)) {
      e.email = "Enter a valid email address";
    }
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post("/api/auth/signup", {
        email: email.trim(),
        username: username.trim(),
        password,
      });
      if ((res.status === 200 || res.status === 201) && res.data?.user) {
        persistSession(res.data);
        toast({
          title: "Welcome to Propatyc!",
          description: "Your account has been created.",
          variant: "success",
        });
        navigate(returnPath, { replace: true });
      }
    } catch (err) {
      toast({
        title: "Sign-up failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formBody = (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Full Name" required error={errors.username}>
          <Input
            type="text"
            autoComplete="name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((p) => ({ ...p, username: "" }));
            }}
            placeholder="John Doe"
          />
        </Field>

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

        <Field
          label="Password"
          required
          error={errors.password}
          hint="Minimum 6 characters"
        >
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
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

        <Button type="submit" variant="brand" loading={loading} className="w-full">
          Create Account
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
          <CardTitle className="text-2xl font-extrabold">
            Create your account
          </CardTitle>
          <CardDescription>
            Join Propatyc to explore video tours, request site visits, or publish properties.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {formBody}
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/signin"
              state={location.state}
              className="font-semibold text-brand hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
