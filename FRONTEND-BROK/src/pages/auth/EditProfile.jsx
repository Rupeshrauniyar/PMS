import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Mail, Phone, User } from "lucide-react";

import { authApi } from "@/api/broker";
import { useApp } from "@/contexts/AppContext";
import { getErrorMessage } from "@/lib/errors";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { RoleBadge } from "@/components/broker/BrokerBrand";

const COUNTRY_CODES = [
  { code: "+977", label: "🇳🇵 +977 (Nepal)" },
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+1", label: "🇺🇸 +1 (US/CA)" },
];

function splitStoredPhone(raw) {
  if (!raw) return { code: "+977", number: "" };
  const match = COUNTRY_CODES.find((c) => String(raw).trim().startsWith(c.code));
  if (match) {
    return {
      code: match.code,
      number: String(raw).trim().slice(match.code.length).trim(),
    };
  }
  return { code: "+977", number: String(raw).replace(/[^\d]/g, "") };
}

export default function EditProfile() {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const initialPhone = splitStoredPhone(user?.phone);
  const [username, setUsername] = useState(user?.username || "");
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [phoneDigits, setPhoneDigits] = useState(initialPhone.number);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const composedPhone = phoneDigits.trim()
    ? `${countryCode} ${phoneDigits.trim()}`
    : "";

  const hasChanges =
    username.trim() !== (user?.username || "") ||
    composedPhone !== (user?.phone || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!username.trim()) {
      next.username = "Full name is required.";
    }
    if (!phoneDigits.trim() || phoneDigits.replace(/\D/g, "").length < 7) {
      next.phone = "Enter a valid contact phone number.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || loading) return;

    setLoading(true);
    try {
      const res = await authApi.editProfile({
        username: username.trim(),
        phone: composedPhone,
      });
      if (res?.user) {
        setUser(res.user);
      }
      toast({
        variant: "success",
        title: "Broker profile updated",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't update profile",
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
          Edit Broker Profile
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3.5">
            <Avatar src={user?.pp} name={username || user?.username} size="lg" />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{username || user?.username || "Broker"}</CardTitle>
                <RoleBadge role={user?.role} />
              </div>
              <CardDescription className="truncate">{user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field
              label="Email Address"
              hint="Account login email cannot be changed"
            >
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-10 pr-10"
                />
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </Field>

            <Field label="Full Name" required error={errors.username}>
              <div className="relative">
                <User
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((p) => ({ ...p, username: undefined }));
                  }}
                  placeholder="Your full name"
                  className="pl-10"
                />
              </div>
            </Field>

            <Field
              label="Phone Number"
              required
              error={errors.phone}
              hint="Shared with buyers and property owners once you claim a visit"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Country code"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="relative sm:col-span-7">
                  <Phone
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="tel"
                    value={phoneDigits}
                    onChange={(e) => {
                      setPhoneDigits(e.target.value.replace(/[^\d]/g, ""));
                      setErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    placeholder="9812345678"
                    aria-label="Phone digits"
                    className="pl-10"
                  />
                </div>
              </div>
            </Field>

            {hasChanges ? (
              <p className="rounded-xl border border-warning/30 bg-warning-soft/50 px-3.5 py-2 text-xs font-medium text-foreground">
                You have unsaved profile changes.
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
                disabled={loading}
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
}
