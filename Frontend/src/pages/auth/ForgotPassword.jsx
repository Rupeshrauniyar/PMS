import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeClosed, KeyRound, AlertCircle } from "lucide-react";

import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

const ForgotPassword = () => {
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
    let cancelled = false;
    (async () => {
      try {
        const res = await api.post("/api/cred/verify-token", { token });
        if (!cancelled) setValidToken(Boolean(res.data?.success));
      } catch {
        if (!cancelled) setValidToken(false);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const validate = () => {
    const e = {};
    if (!newPassword) e.newPass = "New password is required";
    else if (newPassword.length < 8) e.newPass = "At least 8 characters";
    if (!confirmPassword) e.confirm = "Confirm your new password";
    else if (newPassword !== confirmPassword) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post("/api/cred/forgot-password", {
        token,
        newPassword,
      });
      if (res.status === 200) {
        toast({
          title: "Password reset complete",
          description: "You can now sign in with your new password.",
          variant: "success",
        });
        navigate("/signin");
      }
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err.response?.data?.message || "Reset link may have expired.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="mx-auto max-w-md py-16">
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="mx-auto max-w-md py-16">
        <EmptyState
          icon={AlertCircle}
          title="Reset link expired or invalid"
          description="Request a fresh password reset email to set a new password."
          action={
            <Button asChild variant="brand">
              <Link to="/pass-reset-mail">Request new reset link</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-md flex-col justify-center py-8">
      <Card className="shadow-card">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Enter a new password of at least 8 characters.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="New Password" required error={errors.newPass}>
              <Input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((p) => ({ ...p, newPass: "" }));
                }}
                placeholder="••••••••"
              />
            </Field>

            <Field label="Confirm Password" required error={errors.confirm}>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((p) => ({ ...p, confirm: "" }));
                  }}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide passwords" : "Show passwords"}
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
              Save New Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
