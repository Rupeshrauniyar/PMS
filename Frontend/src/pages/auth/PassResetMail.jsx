import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2, ChevronLeft } from "lucide-react";

import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const PassResetMail = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required");
      return false;
    }
    if (!/^[\w.-]+@[\w.-]+\.[A-Z]{2,8}$/i.test(trimmed)) {
      setError("Enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post("/api/cred/send-pass-reset-mail", {
        email: email.trim(),
      });
      if (res.status === 200) {
        setSent(true);
        toast({
          title: "Reset email sent",
          description: res.data?.message || "Check your inbox for the reset link.",
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Could not send reset email",
        description: err.response?.data?.message || "Please verify your email address.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-md flex-col justify-center py-8">
      <Card className="shadow-card">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            {sent ? (
              <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            ) : (
              <Mail className="size-5" aria-hidden="true" />
            )}
          </div>
          <CardTitle className="text-xl">
            {sent ? "Check your inbox" : "Reset your password"}
          </CardTitle>
          <CardDescription>
            {sent
              ? `We sent a password reset link to ${email.trim()}.`
              : "Enter your account email and we'll send you a secure reset link."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {sent ? (
            <div className="flex flex-col gap-2.5">
              <Button asChild variant="brand" className="w-full">
                <Link to="/signin">Return to Sign In</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSent(false)}
                className="w-full"
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Field label="Email Address" required error={error}>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                />
              </Field>

              <Button type="submit" variant="brand" loading={loading} className="w-full">
                Send Reset Link
              </Button>

              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to="/signin">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  <span>Back to Sign In</span>
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PassResetMail;
