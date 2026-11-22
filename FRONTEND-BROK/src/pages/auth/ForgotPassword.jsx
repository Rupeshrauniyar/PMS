import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeClosed, Lock, AlertTriangle, Loader2 } from "lucide-react";

import { authApi } from "@/api/broker";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AuthLayout } from "@/components/broker/AuthLayout";

export default function ForgotPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authApi.verifyResetToken(token);
        if (active) setValidToken(Boolean(res?.success));
      } catch {
        if (active) setValidToken(false);
      } finally {
        if (active) setVerifying(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!newPassword || newPassword.length < 8) {
      next.newPassword = "Password must be at least 8 characters.";
    }
    if (confirmPassword !== newPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || loading) return;

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast({
        variant: "success",
        title: "Password updated!",
        description: "You can now sign in with your new broker password.",
      });
      navigate("/signin", { replace: true });
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't reset password",
        description: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a strong password for your Propatyc Broker account."
      footer={
        <Link to="/signin" className="font-semibold text-foreground hover:text-brand">
          Back to Sign In
        </Link>
      }
    >
      {verifying ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
          <p className="text-sm font-medium">Verifying reset link...</p>
        </div>
      ) : !validToken ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-destructive">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">
              Reset link expired or invalid
            </p>
            <p className="text-sm text-muted-foreground">
              Request a fresh password reset email to continue.
            </p>
          </div>
          <Button variant="brand" asChild className="w-full">
            <Link to="/pass-reset-mail">Request New Link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="New Password" required error={errors.newPassword}>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((p) => ({ ...p, newPassword: undefined }));
                }}
                placeholder="At least 8 characters"
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

          <Field label="Confirm Password" required error={errors.confirmPassword}>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                placeholder="Repeat new password"
                className="pl-10"
              />
            </div>
          </Field>

          <Button
            type="submit"
            variant="brand"
            loading={loading}
            className="w-full"
          >
            Save New Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
