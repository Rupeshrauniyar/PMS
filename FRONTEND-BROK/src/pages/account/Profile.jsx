import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  Edit3,
  Lock,
  Settings,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  CalendarCheck,
  Inbox,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useDashboard } from "@/hooks/useVisits";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { RoleBadge } from "@/components/broker/BrokerBrand";

export default function Profile() {
  const { user, signOut } = useApp();
  const { counts } = useDashboard();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Active Broker";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Identity Hero Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary via-primary/90 to-brand/80" />
        <CardContent className="-mt-12 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar
                src={user?.pp}
                name={user?.username}
                size="xl"
                className="ring-4 ring-card shadow-card"
              />
              <div className="pb-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                    {user?.username || "Propatyc Broker"}
                  </h1>
                  <RoleBadge role={user?.role} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Propatyc Verified Site Visit Coordinator
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/edit-profile">
                  <Edit3 className="size-4" aria-hidden="true" />
                  <span>Edit Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="size-4" aria-hidden="true" />
                  <span>Settings</span>
                </Link>
              </Button>
            </div>
          </div>

          {!user?.phone ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/35 bg-warning-soft/50 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5 text-foreground">
                <AlertCircle className="size-4 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  Add your phone number so buyers and property owners can reach you on site visit days.
                </span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/edit-profile">Add Phone</Link>
              </Button>
            </div>
          ) : null}

          {/* Broker Performance Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill
              icon={ClipboardCheck}
              label="Claimed"
              value={counts?.claimed ?? "—"}
              to="/visits?tab=claimed"
            />
            <StatPill
              icon={CalendarCheck}
              label="Scheduled"
              value={counts?.scheduled ?? "—"}
              to="/visits?tab=scheduled"
            />
            <StatPill
              icon={CheckCircle2}
              label="Completed"
              value={counts?.completed ?? "—"}
              to="/visits?tab=closed"
            />
            <StatPill
              icon={Inbox}
              label="Open Pool"
              value={counts?.pool ?? "—"}
              to="/pool"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle>Broker Contact Information</CardTitle>
          <CardDescription>
            Shared with buyers and property owners on visits assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/65">
          <InfoRow icon={Mail} label="Email Address" value={user?.email} />
          <InfoRow
            icon={Phone}
            label="Phone Number"
            value={user?.phone}
            badge={
              user?.phone ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Missing</Badge>
              )
            }
          />
          <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Security &amp; Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <ActionLink to="/edit-profile" icon={Edit3} label="Update Name & Phone Number" />
          {!user?.uuid ? (
            <ActionLink to="/change-password" icon={Lock} label="Change Password" />
          ) : null}
          <ActionLink to="/settings" icon={Settings} label="App Settings, Themes & Legal" />

          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            className="flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-danger-soft/50"
          >
            <span className="inline-flex items-center gap-3">
              <LogOut className="size-4.5" aria-hidden="true" />
              <span>Sign Out</span>
            </span>
            <ChevronRight className="size-4 opacity-70" aria-hidden="true" />
          </button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Sign out of Broker Console?"
        description="You can sign back in anytime with your broker email or Google account."
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

function StatPill({ icon, label, value, to }) {
  const Icon = icon;
  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-1 rounded-2xl border border-border/75 bg-muted/35 p-3.5 transition-colors hover:bg-accent"
    >
      <Icon className="size-4 text-brand" aria-hidden="true" />
      <span className="text-xl font-extrabold tracking-tight text-foreground">{value}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </Link>
  );
}

function InfoRow({ icon, label, value, badge }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold text-foreground selectable">
            {value || "Not provided"}
          </p>
        </div>
      </div>
      {badge || null}
    </div>
  );
}

function ActionLink({ to, icon, label }) {
  const Icon = icon;
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
    >
      <span className="inline-flex items-center gap-3">
        <Icon className="size-4.5 text-muted-foreground" aria-hidden="true" />
        <span>{label}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
