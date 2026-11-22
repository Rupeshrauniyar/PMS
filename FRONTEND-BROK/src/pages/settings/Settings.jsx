import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import {
  ArrowLeft,
  User,
  Edit3,
  Lock,
  Sun,
  Moon,
  BookOpen,
  Shield,
  LogOut,
  ChevronRight,
  Bell,
  Compass,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { RoleBadge } from "@/components/broker/BrokerBrand";

export default function Settings() {
  const { user, signOut } = useApp();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch {
        /* ignore native Google sign-out if not signed in via Google */
      }
    }
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your Propatyc Broker account, theme, and policies
          </p>
        </div>
      </div>

      {/* Signed-in summary */}
      {user ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={user.pp} name={user.username} size="default" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-foreground">
                    {user.username || "Broker"}
                  </p>
                  <RoleBadge role={user.role} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/profile">View</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Account */}
      {user ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <SettingsRow icon={User} label="Your Broker Profile" to="/profile" />
            <SettingsRow icon={Edit3} label="Edit Name & Phone" to="/edit-profile" />
            <SettingsRow icon={Bell} label="Notifications" to="/notifications" />
            {!user.uuid ? (
              <SettingsRow icon={Lock} label="Change Password" to="/change-password" />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between rounded-2xl px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                {isDark ? (
                  <Moon className="size-4.5 text-brand" aria-hidden="true" />
                ) : (
                  <Sun className="size-4.5 text-brand" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Quick Dark Mode</p>
                <p className="text-xs text-muted-foreground capitalize">
                  Preference: {theme}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              Switch to {isDark ? "Light" : "Dark"}
            </Button>
          </div>
          <SettingsRow icon={Sun} label="Theme Options (Light / Dark / System)" to="/themes" />
        </CardContent>
      </Card>

      {/* Legal & About */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            About &amp; Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingsRow icon={Compass} label="About Propatyc Broker Console" to="/intro" />
          <SettingsRow icon={BookOpen} label="Terms & Conditions" to="/termsandcondition" />
          <SettingsRow icon={Shield} label="Privacy Policy" to="/privacyandpolicy" />
        </CardContent>
      </Card>

      {/* Sign out */}
      {user?._id ? (
        <Card className="border-destructive/25">
          <CardContent>
            <button
              type="button"
              onClick={() => setConfirmSignOut(true)}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-danger-soft/50"
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-danger-soft text-destructive">
                  <LogOut className="size-4.5" aria-hidden="true" />
                </span>
                <span>Sign Out</span>
              </span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </CardContent>
        </Card>
      ) : null}

      <p className="pb-4 text-center text-xs text-muted-foreground">
        Propatyc Broker — Site Visit Console · © {new Date().getFullYear()} Propatyc
      </p>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Sign out of Broker Console?"
        description="You will stop receiving push notifications on this device until you sign back in."
        confirmLabel="Sign out"
        destructive
        onConfirm={handleSignOut}
      />
    </div>
  );
}

function SettingsRow({ icon, label, to }) {
  const Icon = icon;
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
    >
      <span className="inline-flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <span>{label}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
