import React, { useContext } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  CalendarCheck,
  User,
  Sun,
  Moon,
  Settings,
  LogOut,
  Bookmark,
  Palette,
  Building2,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { AppContext } from "../contexts/AppContext";
import api from "../api/client";
import { NotificationBell } from "./NotificationBell";
import { UserAvatarButton } from "./UserAvatarButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const DESKTOP_LINKS = [
  { to: "/", label: "Explore", end: true },
  { to: "/search", label: "Search" },
  { to: "/visits", label: "Visits" },
  { to: "/intro", label: "About" },
  { to: "/profile", label: "Profile" },
];

const MOBILE_TABS = [
  { to: "/", label: "Explore", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/add-property", label: "List", icon: Plus, accent: true },
  { to: "/visits", label: "Visits", icon: CalendarCheck },
  { to: "/profile", label: "Profile", icon: User },
];

export function shouldHideChrome(pathname) {
  return pathname === "/intro";
}

export function shouldHideMobileTabbar(pathname) {
  if (shouldHideChrome(pathname)) return true;
  return (
    pathname.startsWith("/view/") ||
    pathname.startsWith("/book/") ||
    pathname === "/add-property" ||
    pathname.startsWith("/edit-property/") ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/pass-reset-mail" ||
    pathname.startsWith("/forgot-password/")
  );
}

/** Crisp monochrome architectural mark */
function PropatycMark({ className }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="28" height="28" rx="8" fill="currentColor" />
      <path
        d="M8.5 20V11.2L14 7.5L19.5 11.2V20H15.8V15.2H12.2V20H8.5Z"
        fill="var(--background)"
      />
    </svg>
  );
}

const Navbar = () => {
  const { user, setUser } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  if (shouldHideChrome(location.pathname)) {
    return null;
  }

  const hideBottomBar = shouldHideMobileTabbar(location.pathname);

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
        localStorage.removeItem("refreshToken");
      } catch {
        /* ignore */
      }
      toast({
        title: "Signed out",
        description: "See you again soon.",
      });
      navigate("/signin");
    }
  };

  return (
    <>
      {/* Minimal Monochrome Top Header */}
      <header className="chrome-fixed-top glass fixed inset-x-0 top-0 z-40 border-b border-border/60 pt-safe">
        <div className="mx-auto flex h-[3.75rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Monochrome Brand Wordmark */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg"
          >
            <PropatycMark />
            <span className="text-[17px] font-extrabold tracking-[-0.035em] text-foreground">
              Propatyc
            </span>
          </Link>

          {/* Desktop Center Navigation */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 rounded-full border border-border/70 bg-secondary/50 p-1 lg:flex"
          >
            {DESKTOP_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-8 items-center rounded-full px-4 text-[13px] font-semibold transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="default"
              size="sm"
              className="hidden rounded-full px-4 lg:inline-flex"
            >
              <Link to="/add-property">
                <Plus className="size-3.5" aria-hidden="true" />
                <span>List property</span>
              </Link>
            </Button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              className="inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {theme === "dark" ? (
                <Sun className="size-[18px]" aria-hidden="true" />
              ) : (
                <Moon className="size-[18px]" aria-hidden="true" />
              )}
            </button>

            {user ? (
              <>
                <NotificationBell user={user} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open account menu"
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background p-1 sm:pr-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <UserAvatarButton user={user} size="xs" />
                      <span className="hidden max-w-24 truncate text-xs font-semibold text-foreground sm:inline">
                        {user.username || "Account"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl border-border/80 p-1.5 shadow-float"
                  >
                    <DropdownMenuLabel className="px-2.5 py-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {user.username || "Propatyc Member"}
                      </p>
                      {user.email ? (
                        <p className="truncate text-xs font-normal text-muted-foreground">
                          {user.email}
                        </p>
                      ) : null}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <User className="size-4" aria-hidden="true" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/visits")}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <CalendarCheck className="size-4" aria-hidden="true" />
                      <span>Site Visits</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/bookings")}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <Bookmark className="size-4" aria-hidden="true" />
                      <span>Saved &amp; Bookings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/add-property")}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <Building2 className="size-4" aria-hidden="true" />
                      <span>List a Property</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/themes")}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <Palette className="size-4" aria-hidden="true" />
                      <span>Appearance</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <Settings className="size-4" aria-hidden="true" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleSignOut}
                      className="cursor-pointer rounded-xl py-2"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="rounded-full px-4">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Monochrome Mobile Dock */}
      {!hideBottomBar ? (
        <nav
          aria-label="Mobile navigation"
          className="chrome-fixed-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-border/60 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] lg:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1">
            {MOBILE_TABS.map((tab) => {
              const Icon = tab.icon;
              if (tab.accent) {
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    aria-label="List a property"
                    className="flex flex-col items-center justify-center py-0.5"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-95">
                      <Icon className="size-5 stroke-[2.2]" aria-hidden="true" />
                    </span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10.5px] font-semibold tracking-tight transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "size-[19px] transition-transform",
                          isActive ? "stroke-[2.4]" : "stroke-[1.75]",
                        )}
                        aria-hidden="true"
                      />
                      <span>{tab.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
};

export default Navbar;
