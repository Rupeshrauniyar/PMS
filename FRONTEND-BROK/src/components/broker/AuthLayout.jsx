import React from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, ShieldCheck, CalendarCheck, Inbox } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { BrokerBrand } from "./BrokerBrand";

const HIGHLIGHTS = [
  {
    icon: Inbox,
    title: "Live Open Request Pool",
    desc: "Claim owner-approved property visit requests in real time.",
  },
  {
    icon: CalendarCheck,
    title: "3-Way Site Visit Scheduler",
    desc: "Confirm date, meeting point, and .ics invites for buyer & owner.",
  },
  {
    icon: ShieldCheck,
    title: "Protected Contact Hub",
    desc: "Direct one-tap Call, WhatsApp & Email once a visit is assigned.",
  },
];

export function AuthLayout({ title, subtitle, children, footer }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      {/* Minimal top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/intro" className="outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl">
          <BrokerBrand />
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="size-4.5" aria-hidden="true" />
            ) : (
              <Moon className="size-4.5" aria-hidden="true" />
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/intro">About Portal</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:py-12">
        {/* Left brand pitch (desktop) */}
        <div className="hidden space-y-6 lg:col-span-6 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1 text-xs font-bold text-brand">
            <span>Propatyc Broker Portal</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground">
            Coordinate verified property visits with zero friction.
          </h2>

          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            Built exclusively for Propatyc field brokers and superbrokers to claim owner-approved site visits, lock 3-way appointments, and guide buyers &amp; owners on site.
          </p>

          <div className="space-y-3.5 pt-2">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.title}
                  className="flex items-start gap-3.5 rounded-2xl border border-border/75 bg-card/80 p-4 shadow-soft"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{h.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right form card */}
        <div className="mx-auto w-full max-w-md lg:col-span-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-card sm:p-8">
            <div className="mb-6 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand lg:hidden">
                Propatyc Broker Portal — Coordinate verified property visits
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            {children}

            {footer ? (
              <div className="mt-6 border-t border-border/65 pt-5 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
