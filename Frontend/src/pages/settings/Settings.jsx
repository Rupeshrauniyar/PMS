import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Edit3,
  Lock,
  Palette,
  FileText,
  Shield,
  LogOut,
  CalendarCheck,
  Bookmark,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
  try {
    GoogleAuth.initialize({
      clientId:
        "740141742340-u1ila9q261spisi75680vlhaptp00kqg.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      grantOfflineAccess: true,
    });
  } catch {
    /* ignore */
  }
}

function SettingsRow({ icon: Icon, label, sublabel, onClick, destructive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        destructive
          ? "flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left text-destructive transition-colors hover:bg-danger-soft/60"
          : "flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left text-foreground transition-colors hover:bg-accent/70"
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={
            destructive
              ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-destructive"
              : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground"
          }
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          {sublabel ? (
            <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
          ) : null}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

const Settings = () => {
  const { user, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signOutOpen, setSignOutOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => {});
      }
      await api
        .post("/api/auth/signout", {
          fcmToken: localStorage.getItem("fcmToken") || undefined,
        })
        .catch(() => {});
    } finally {
      setUser(null);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch {
        /* ignore */
      }
      toast({
        title: "Signed out",
        description: "You have been signed out of Propatyc.",
      });
      navigate("/signin");
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-5 sm:py-8">
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
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your account, appearance, and legal preferences.
        </p>
      </div>

      {/* User Summary */}
      {user ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <Avatar src={user.pp} name={user.username || "User"} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">
                  {user.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/edit-profile">Edit</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">
                Sign in to Propatyc
              </p>
              <p className="text-xs text-muted-foreground">
                Save properties, request site visits, and publish listings.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/signin">Sign in</Link>
              </Button>
              <Button asChild variant="brand" size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account */}
      {user ? (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Account &amp; Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <SettingsRow
              icon={User}
              label="My Profile"
              sublabel="Listings, bookings, and saved homes"
              onClick={() => navigate("/profile")}
            />
            <SettingsRow
              icon={Edit3}
              label="Edit Profile"
              sublabel="Update full name and phone number"
              onClick={() => navigate("/edit-profile")}
            />
            <SettingsRow
              icon={CalendarCheck}
              label="Site Visits"
              sublabel="3-party visit requests and schedules"
              onClick={() => navigate("/visits")}
            />
            <SettingsRow
              icon={Bookmark}
              label="My Space"
              sublabel="Manage reservations and saved listings"
              onClick={() => navigate("/bookings")}
            />
            {!user.uuid ? (
              <SettingsRow
                icon={Lock}
                label="Change Password"
                sublabel="Update your account password"
                onClick={() => navigate("/change-password")}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <SettingsRow
            icon={Palette}
            label="Appearance & Theme"
            sublabel="Switch between Light and Dark mode"
            onClick={() => navigate("/themes")}
          />
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Legal &amp; About
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <SettingsRow
            icon={FileText}
            label="Terms & Conditions"
            sublabel="Platform rules and usage terms"
            onClick={() => navigate("/termsandcondition")}
          />
          <SettingsRow
            icon={Shield}
            label="Privacy Policy"
            sublabel="How Propatyc protects your data"
            onClick={() => navigate("/privacyandpolicy")}
          />
        </CardContent>
      </Card>

      {/* Sign Out */}
      {user?._id ? (
        <Card>
          <CardContent className="py-1">
            <SettingsRow
              icon={LogOut}
              label="Sign Out"
              sublabel="Log out from this device"
              destructive
              onClick={() => setSignOutOpen(true)}
            />
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Propatyc · Property Management System
      </p>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out of Propatyc?"
        description="You can sign back in anytime to access your saved homes and visits."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default Settings;
