import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeClosed, Lock, ShieldAlert } from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

const ChangePassword = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user?.uuid) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          icon={ShieldAlert}
          title="Managed by Google Sign-In"
          description="Your account uses Google authentication, so there is no separate Propatyc password to change."
          action={
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
          }
        />
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!currentPassword) e.current = "Enter your current password";
    if (!newPassword) e.next = "Enter a new password";
    else if (newPassword.length < 6) e.next = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post("/api/auth/edit-profile", {
        currentPassword,
        newPassword,
      });
      if (res.status === 200) {
        setCurrentPassword("");
        setNewPassword("");
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
          variant: "success",
        });
        navigate("/settings");
      }
    } catch (err) {
      toast({
        title: "Could not change password",
        description: err.response?.data?.message || "Check your current password.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-6 sm:py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="-ml-2 self-start gap-1.5"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span>Back</span>
      </Button>

      <Card className="shadow-card">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Change Password</CardTitle>
          <CardDescription>
            Choose a strong password that you don&apos;t reuse elsewhere.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Current Password" required error={errors.current}>
              <Input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrors((p) => ({ ...p, current: "" }));
                }}
                placeholder="••••••••"
              />
            </Field>

            <Field
              label="New Password"
              required
              error={errors.next}
              hint="Minimum 6 characters"
            >
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((p) => ({ ...p, next: "" }));
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
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
};

export default ChangePassword;
