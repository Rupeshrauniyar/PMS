import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Lock } from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

const DEFAULT_CODE = "+977";

function extractLocalPhone(rawPhone) {
  if (!rawPhone) return "";
  return String(rawPhone).replace(/^\+977\s*/, "").replace(/[^\d]/g, "");
}

const EditProfile = ({ css = false, error: externalError = null }) => {
  const { user, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [username, setUsername] = useState(() => user?.username || "");
  const [phoneDigits, setPhoneDigits] = useState(() =>
    extractLocalPhone(user?.phone),
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const composedPhone = phoneDigits ? `${DEFAULT_CODE} ${phoneDigits}` : "";

  const hasChanges =
    username.trim() !== (user?.username || "").trim() ||
    composedPhone !== (user?.phone || "");

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Full name is required";
    if (!phoneDigits || phoneDigits.length < 10) {
      e.phone = "Enter a valid 10-digit contact number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.post("/api/auth/edit-profile", {
        _id: user?._id,
        username: username.trim(),
        phone: composedPhone,
      });
      if (res.status === 200 && res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        } catch {
          /* ignore */
        }
        toast({
          title: "Profile saved",
          description: "Your name and contact number have been updated.",
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Could not update profile",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (css) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3">
          <Avatar src={user?.pp} name={user?.username || "User"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {user?.username || "Member"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          {user?.phone ? (
            <Badge variant="success">Verified</Badge>
          ) : null}
        </div>

        <Field label="Full Name" required error={errors.username}>
          <Input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((p) => ({ ...p, username: "" }));
            }}
            placeholder="Your full name"
          />
        </Field>

        <Field
          label="Phone Number (+977)"
          required
          error={errors.phone || externalError}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-11 shrink-0 items-center rounded-xl border border-input bg-muted px-3 text-sm font-semibold text-foreground">
              🇳🇵 +977
            </span>
            <Input
              type="tel"
              inputMode="numeric"
              value={phoneDigits}
              onChange={(e) => {
                setPhoneDigits(e.target.value.replace(/[^\d]/g, "").slice(0, 10));
                setErrors((p) => ({ ...p, phone: "" }));
              }}
              placeholder="98XXXXXXXX"
            />
          </div>
        </Field>

        {hasChanges ? (
          <Button type="submit" variant="default" size="sm" loading={loading}>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <span>Save contact info</span>
          </Button>
        ) : null}
      </form>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-5 sm:py-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 mb-1 gap-1.5"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Edit Profile
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Keep your name and phone number accurate for site visit coordination.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 border-b border-border/60">
          <Avatar src={user?.pp} name={user?.username || "User"} size="lg" />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{user?.username || "Member"}</CardTitle>
            <CardDescription className="truncate">{user?.email}</CardDescription>
          </div>
          {user?.phone ? (
            <Badge variant="success">Verified</Badge>
          ) : (
            <Badge variant="warning">Phone missing</Badge>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field
              label="Email Address"
              hint="Your account email cannot be changed."
            >
              <div className="relative">
                <Input value={user?.email || ""} disabled />
                <Lock
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </Field>

            <Field label="Full Name" required error={errors.username}>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((p) => ({ ...p, username: "" }));
                }}
                placeholder="John Doe"
              />
            </Field>

            <Field
              label="Phone Number"
              required
              error={errors.phone}
              hint="Shared with your assigned Propatyc broker once a visit is claimed."
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-11 shrink-0 items-center rounded-xl border border-input bg-muted px-3.5 text-sm font-semibold text-foreground">
                  🇳🇵 +977
                </span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={phoneDigits}
                  onChange={(e) => {
                    setPhoneDigits(
                      e.target.value.replace(/[^\d]/g, "").slice(0, 10),
                    );
                    setErrors((p) => ({ ...p, phone: "" }));
                  }}
                  placeholder="9812345678"
                />
              </div>
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                loading={loading}
                disabled={!hasChanges}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
