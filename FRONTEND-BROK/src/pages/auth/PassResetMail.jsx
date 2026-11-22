import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";

import { authApi } from "@/api/broker";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AuthLayout } from "@/components/broker/AuthLayout";

export default function PassResetMail() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendPasswordResetMail(email.trim());
      setSent(true);
      toast({
        variant: "success",
        title: "Reset link sent",
        description: res?.message || "Check your inbox for the broker password reset link.",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't send reset link",
        description: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Broker Password"
      subtitle="Enter the email registered with your Propatyc Broker account."
      footer={
        <Link
          to="/signin"
          className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-brand"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Sign In</span>
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link for <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Send to a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Broker Email" required error={error}>
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
                  setError("");
                }}
                placeholder="broker@propatyc.com"
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
            Send Password Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
