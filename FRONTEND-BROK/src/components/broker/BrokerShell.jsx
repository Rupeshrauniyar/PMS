import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  ClipboardCheck,
  CalendarDays,
  Layers,
  Bell,
  UserCircle2,
  Settings,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useLive } from "@/contexts/LiveContext";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { BrokerBrand, RoleBadge } from "./BrokerBrand";

const CHROMELESS_PREFIXES = [
  "/signin",
  "/signup",
  "/pass-reset-mail",
  "/forgot-password",
  "/intro",
];

function isChromelessPath(pathname) {
  return CHROMELESS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function BrokerShell({ children }) {
  const { user, isSuperbroker, signOut } = useApp();
  const live = useLive();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);

  const poolCount = live?.poolCount ?? 0;
  const unreadCount = live?.unreadCount ?? 0;

  const hideChrome = isChromelessPath(location.pathname) || !user;

  const primaryNav = React.useMemo(() => {
    const items = [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      {
        to: "/pool",
        label: "Open Pool",
        icon: Inbox,
        badge: poolCount > 0 ? poolCount : null,
        badgeTone: "brand",
      },
      { to: "/visits", label: "My Visits", icon: ClipboardCheck },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
    ];
    if (isSuperbroker) {
      items.push({
        to: "/all",
        label: "All Visits",
        icon: Layers,
      });
    }
    return items;
  }, [poolCount, isSuperbroker]);

  const secondaryNav = React.useMemo(
    () => [
      {
        to: "/notifications",
        label: "Notifications",
        icon: Bell,
        badge: unreadCount > 0 ? unreadCount : null,
        badgeTone: "destructive",
      },
      { to: "/profile", label: "Profile", icon: UserCircle2 },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
    [unreadCount],
  );

  const mobileTabs = React.useMemo(
    () => [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      {
        to: "/pool",
        label: "Pool",
        icon: Inbox,
        badge: poolCount > 0 ? poolCount : null,
      },
      { to: "/visits", label: "Visits", icon: ClipboardCheck },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/profile", label: "Profile", icon: UserCircle2 },
    ],
    [poolCount],
  );

  if (hideChrome) {
    return <main className="app-main no-chrome min-h-svh w-full">{children}</main>;
  }

  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      {/* Desktop Left Sidebar Rail (lg+) */}
      <aside
        aria-label="Broker navigation"
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      >
        <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-5 py-4">
          <Link to="/" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <BrokerBrand />
          </Link>
        </div>

        <div className="flex items-center justify-between border-b border-sidebar-border/60 bg-muted/35 px-5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Access Level
          </span>
          <RoleBadge role={user?.role} />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Operations
            </p>
            {primaryNav.map((item) => (
              <SidebarNavLink key={item.to} item={item} />
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </p>
            {secondaryNav.map((item) => (
              <SidebarNavLink key={item.to} item={item} />
            ))}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="inline-flex items-center gap-2">
              {isDark ? (
                <Moon className="size-4 text-brand" aria-hidden="true" />
              ) : (
                <Sun className="size-4 text-brand" aria-hidden="true" />
              )}
              <span>{isDark ? "Dark theme" : "Light theme"}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">Switch</span>
          </button>

          <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-2.5 shadow-soft">
            <Link to="/profile" className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Avatar src={user?.pp} name={user?.username} size="sm" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {user?.username || "Broker"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || "Active session"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmSignOut(true)}
              aria-label="Sign out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Glass Bar (<lg) */}
      <header className="chrome-fixed-top glass fixed inset-x-0 top-0 z-40 border-b border-border/70 pt-safe lg:hidden">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 outline-none">
            <BrokerBrand />
          </Link>

          <div className="flex items-center gap-1.5">
            <RoleBadge role={user?.role} className="hidden sm:inline-flex" />

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="size-5" aria-hidden="true" />
              ) : (
                <Moon className="size-5" aria-hidden="true" />
              )}
            </Button>

            <Link
              to="/notifications"
              aria-label={
                unreadCount > 0
                  ? `Notifications (${unreadCount} unread)`
                  : "Notifications"
              }
              className="relative inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Bell className="size-5" aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>

            <Link
              to="/settings"
              aria-label="Settings"
              className="inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Settings className="size-5" aria-hidden="true" />
            </Link>

            <Link
              to="/profile"
              aria-label="Your profile"
              className="ml-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Avatar src={user?.pp} name={user?.username} size="xs" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <main className="app-main lg:pt-8">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Docked Bottom Tab Bar (<lg) */}
      <nav
        aria-label="Primary mobile navigation"
        className="chrome-fixed-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-border/75 pb-[max(0.4rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] lg:hidden"
      >
        <div className="mx-auto grid h-[4.1rem] max-w-lg grid-cols-5 items-center gap-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive
                      ? "text-brand"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                        isActive && "bg-brand-soft text-brand",
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      {tab.badge ? (
                        <span className="absolute -top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-brand-foreground ring-2 ring-background">
                          {tab.badge > 99 ? "99+" : tab.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="leading-tight">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Sign out of Broker Console?"
        description="You will stop receiving live site visit pool alerts on this device until you sign back in."
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

function SidebarNavLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isActive
            ? "bg-primary text-primary-foreground shadow-soft"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="inline-flex items-center gap-3 min-w-0">
            <Icon
              className={cn(
                "size-4.5 shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden="true"
            />
            <span className="truncate">{item.label}</span>
          </span>
          {item.badge ? (
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : item.badgeTone === "destructive"
                    ? "bg-destructive text-white"
                    : "bg-brand-soft text-brand",
              )}
            >
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}
