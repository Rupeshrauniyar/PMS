import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Lock,
  Palette,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

function Row({ icon: Icon, label, onClick, destructive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        destructive
          ? "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-danger-soft/50"
          : "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
      }
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 opacity-75" aria-hidden="true" />
        <span>{label}</span>
      </span>
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
      toast({ title: "Signed out" });
      navigate("/signin");
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-4 pb-16 sm:py-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
      </div>

      {!user ? (
        <div className="flex items-center justify-between rounded-2xl border border-border p-4">
          <span className="text-sm font-medium text-foreground">Not signed in</span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/signin">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border">
        {user ? (
          <>
            <Row
              icon={Edit3}
              label="Edit profile"
              onClick={() => navigate("/edit-profile")}
            />
            {!user.uuid ? (
              <Row
                icon={Lock}
                label="Change password"
                onClick={() => navigate("/change-password")}
              />
            ) : null}
          </>
        ) : null}
        <Row
          icon={Palette}
          label="Appearance"
          onClick={() => navigate("/themes")}
        />
        <Row
          icon={FileText}
          label="Terms & Conditions"
          onClick={() => navigate("/termsandcondition")}
        />
        <Row
          icon={Shield}
          label="Privacy Policy"
          onClick={() => navigate("/privacyandpolicy")}
        />
        {user?._id ? (
          <Row
            icon={LogOut}
            label="Sign out"
            destructive
            onClick={() => setSignOutOpen(true)}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        confirmLabel="Sign out"
        destructive
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default Settings;
