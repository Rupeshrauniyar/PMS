import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeClosed, Lock, ShieldAlert } from "lucide-react";

import { authApi } from "@/api/broker";
import { useApp } from "@/contexts/AppContext";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

export default function ChangePassword() {
  const { user } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user?.uuid) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <EmptyState
          icon={ShieldAlert}
          title="Managed by Google Sign-In"
          description="Your broker account authenticates via Google, so password management is handled directly in your Google Account."
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!currentPassword) next.currentPassword = "Enter your current password.";
    if (!newPassword || newPassword.length < 6) {
      next.newPassword = "New password must be at least 6 characters.";
    }
    if (confirmPassword !== newPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || loading) return;

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast({
        variant: "success",
        title: "Password changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/profile");
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't change password",
        description: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Change Password
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Broker Password</CardTitle>
          <CardDescription>
            Keep your Propatyc Broker Console credentials secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Current Password" required error={errors.currentPassword}>
              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setErrors((p) => ({ ...p, currentPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide passwords" : "Show passwords"}
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
                  placeholder="At least 6 characters"
                  className="pl-10"
                />
              </div>
            </Field>

            <Field label="Confirm New Password" required error={errors.confirmPassword}>
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={loading}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
