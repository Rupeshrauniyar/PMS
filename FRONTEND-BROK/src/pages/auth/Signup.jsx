import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeClosed, Lock, Mail, Phone, User } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { authApi } from "@/api/broker";

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
import { useApp } from "@/contexts/AppContext";
import { auth } from "@/contexts/Firebase";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AuthLayout, GoogleMark } from "@/components/broker/AuthLayout";

export default function Signup(props) {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = props?.from || location?.state?.from || "/";
  const from = typeof rawFrom === "string" ? rawFrom : rawFrom?.pathname || "/";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (user?._id) {
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const next = {};
    if (!username.trim()) {
      next.username = "Full name is required.";
    }
    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (phone.trim() && phone.replace(/\D/g, "").length < 10) {
      next.phone = "Enter a valid 10+ digit phone number.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;

    setLoading(true);
    try {
      const res = await authApi.signup({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      if (res?.user) {
        setUser(res.user);
        toast({
          variant: "success",
          title: "Broker account created!",
          description: "Welcome to Propatyc Site Visit Console.",
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast({
        variant: "error",
        title: "Sign-up failed",
        description: getErrorMessage(err, "Couldn't create broker account."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    try {
      let res;
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => {});
        const data = await GoogleAuth.signIn();
        res = await authApi.signinWithGoogle({
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
        const profile = result?.user?.providerData?.[0] || result?.user;
        res = await authApi.signinWithGoogle({
          email: profile?.email,
          uuid: profile?.uid,
          username: profile?.displayName,
          pp: profile?.photoURL,
          idToken,
        });
      }
      if (res?.user) {
        setUser(res.user);
        toast({
          variant: "success",
          title: `Welcome, ${res.user.username || "Broker"}`,
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast({
        variant: "error",
        title: "Google sign-up failed",
        description: getErrorMessage(err, "Couldn't complete Google authentication."),
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create broker account"
      footer={
        <>
          <span>Already registered? </span>
          <button
            type="button"
            onClick={() => navigate("/signin", { state: { from } })}
            className="font-semibold text-foreground hover:underline"
          >
            Sign in
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Full Name" required error={errors.username}>
          <div className="relative">
            <User
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              autoComplete="name"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((p) => ({ ...p, username: undefined }));
              }}
              placeholder="Aarav Sharma"
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Work Email" required error={errors.email}>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="broker@propatyc.com"
              className="pl-10"
            />
          </div>
        </Field>

        <Field
          label="Phone Number"
          error={errors.phone}
          hint="Shared with buyers & owners once you claim a visit"
        >
          <div className="relative">
            <Phone
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="+977 9812345678"
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Minimum 6 characters"
              className="pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {showPass ? (
                <Eye className="size-4" aria-hidden="true" />
              ) : (
                <EyeClosed className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link to="/termsandcondition" className="font-semibold text-foreground underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacyandpolicy" className="font-semibold text-foreground underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button
          type="submit"
          variant="brand"
          loading={loading}
          className="w-full"
        >
          Create Broker Account
        </Button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          loading={googleLoading}
          onClick={handleGoogleAuth}
          className="w-full"
        >
          <GoogleMark />
          <span>Continue with Google</span>
        </Button>
      </form>
    </AuthLayout>
  );
}
