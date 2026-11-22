import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/lib/theme";
import { ConfirmDialog } from "@/components/ui/dialog";

export default function Settings() {
  const { user, signOut } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch {
        /* ignore */
      }
    }
    await signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border">
        {user ? (
          <>
            <Row label="Profile" to="/profile" meta={user.username} />
            <Row label="Edit profile" to="/edit-profile" />
            <Row label="Notifications" to="/notifications" />
            {!user.uuid ? <Row label="Change password" to="/change-password" /> : null}
          </>
        ) : null}

        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          <span>Appearance</span>
          <span className="text-xs font-semibold text-muted-foreground">
            {isDark ? "Dark" : "Light"} · Switch
          </span>
        </button>
        <Row label="Theme preference" to="/themes" />
        <Row label="About" to="/intro" />
        <Row label="Terms & Conditions" to="/termsandcondition" />
        <Row label="Privacy Policy" to="/privacyandpolicy" />

        {user?._id ? (
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-secondary/40"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="size-4" aria-hidden="true" />
              <span>Sign out</span>
            </span>
            <ChevronRight className="size-4 opacity-60" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Sign out?"
        confirmLabel="Sign out"
        destructive
        onConfirm={handleSignOut}
      />
    </div>
  );
}

function Row({ label, to, meta }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
    >
      <span>{label}</span>
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        {meta ? <span className="max-w-[140px] truncate">{meta}</span> : null}
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
