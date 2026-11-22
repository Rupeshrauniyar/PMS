import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeClosed, Lock, Mail } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import { authApi } from "@/api/broker";
import { useApp } from "@/contexts/AppContext";
import { auth } from "@/contexts/Firebase";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AuthLayout, GoogleMark } from "@/components/broker/AuthLayout";

export default function Signin(props) {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = props?.from || location?.state?.from || "/";
  const from = typeof rawFrom === "string" ? rawFrom : rawFrom?.pathname || "/";

  const [email, setEmail] = useState("");
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
    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
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
      const res = await authApi.signin({
        email: email.trim(),
        password,
      });
      if (res?.user) {
        setUser(res.user);
        toast({
          variant: "success",
          title: `Welcome back, ${res.user.username || "Broker"}`,
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast({
        variant: "error",
        title: "Sign-in failed",
        description: getErrorMessage(err, "Invalid broker credentials."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (googleLoading || loading) return;
    const provider = new GoogleAuthProvider();
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const profile = result?.user?.providerData?.[0] || result?.user;
      const res = await authApi.signinWithGoogle({
        email: profile?.email,
        uuid: profile?.uid,
        username: profile?.displayName,
        pp: profile?.photoURL,
      });
      if (res?.user) {
        setUser(res.user);
        toast({
          variant: "success",
          title: `Signed in as ${res.user.username || "Broker"}`,
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast({
        variant: "error",
        title: "Google sign-in failed",
        description: getErrorMessage(err, "Couldn't complete Google sign-in."),
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Broker Sign In"
      subtitle="Sign in to claim pool requests and coordinate 3-way property visits."
      footer={
        <>
          <span>New to the Propatyc broker network? </span>
          <button
            type="button"
            onClick={() => navigate("/signup", { state: { from } })}
            className="font-bold text-brand hover:underline"
          >
            Create broker account
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Broker Email" required error={errors.email}>
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

        <div className="space-y-1.5">
          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="••••••••"
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

          <div className="flex justify-end">
            <Link
              to="/pass-reset-mail"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="brand"
          loading={loading}
          className="w-full"
        >
          Sign in to Console
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
