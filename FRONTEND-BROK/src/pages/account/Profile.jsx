import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useDashboard } from "@/hooks/useVisits";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/dialog";
import { RoleBadge } from "@/components/broker/BrokerBrand";

export default function Profile() {
  const { user, signOut } = useApp();
  const { counts } = useDashboard();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);

  const stats = [
    { label: "To Schedule", value: counts?.claimed ?? "—", to: "/visits?tab=claimed" },
    { label: "Scheduled", value: counts?.scheduled ?? "—", to: "/visits?tab=scheduled" },
    { label: "Completed", value: counts?.completed ?? "—", to: "/visits?tab=closed" },
    { label: "Open Pool", value: counts?.pool ?? "—", to: "/pool" },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-8 py-2">
      {/* Identity */}
      <div className="flex items-center gap-4">
        <Avatar src={user?.pp} name={user?.username} size="xl" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {user?.username || "Broker"}
            </h1>
            <RoleBadge role={user?.role} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          {user?.phone ? (
            <p className="truncate text-xs text-muted-foreground">{user.phone}</p>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="flex flex-col gap-0.5 rounded-2xl border border-border p-3.5 transition-colors hover:bg-secondary/40"
          >
            <span className="text-xl font-bold tabular-nums text-foreground">
              {s.value}
            </span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Single Clean Menu */}
      <div className="divide-y divide-border rounded-2xl border border-border">
        <MenuRow to="/edit-profile" label="Edit profile" meta={!user?.phone ? "Add phone" : null} />
        {!user?.uuid ? <MenuRow to="/change-password" label="Change password" /> : null}
        <MenuRow to="/notifications" label="Notifications" />
        <MenuRow to="/settings" label="Settings" />
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-secondary/40"
        >
          <span className="inline-flex items-center gap-2.5">
            <LogOut className="size-4" aria-hidden="true" />
            <span>Sign out</span>
          </span>
          <ChevronRight className="size-4 opacity-60" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Sign out?"
        confirmLabel="Sign out"
        destructive
        onConfirm={async () => {
          await signOut();
          navigate("/signin", { replace: true });
        }}
      />
    </div>
  );
}

function MenuRow({ to, label, meta }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
    >
      <span>{label}</span>
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        {meta ? <span>{meta}</span> : null}
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
