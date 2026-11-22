import React from "react";
import { Link } from "react-router-dom";
import {
  Inbox,
  CalendarCheck,
  ShieldCheck,
  ArrowRight,
  Download,
  PhoneCall,
  Sun,
  Moon,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/lib/theme";
import { getApiBase } from "@/utils/apiBase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BrokerBrand } from "@/components/broker/BrokerBrand";

const STEPS = [
  {
    icon: Inbox,
    step: "01",
    title: "Claim from the Open Pool",
    description:
      "Once a property owner approves a buyer's visit request, it enters the live broker pool ordered oldest-waiting first.",
  },
  {
    icon: PhoneCall,
    step: "02",
    title: "Unlock 3-Party Contact Hub",
    description:
      "Claiming unlocks verified phone, WhatsApp, and email links for both the buyer and property owner.",
  },
  {
    icon: CalendarCheck,
    step: "03",
    title: "Schedule & Conduct the Tour",
    description:
      "Confirm the date, duration, and meeting point in one tap — notifying all 3 parties with calendar (.ics) & Google Maps links.",
  },
];

export default function Intro() {
  const { user } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const apkUrl = `${getApiBase()}/api/android/getapk`;

  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to={user ? "/" : "/signin"} className="outline-none">
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

            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <a href={apkUrl} download>
                <Download className="size-4" aria-hidden="true" />
                <span>Android APK</span>
              </a>
            </Button>

            <Button variant="brand" size="sm" asChild>
              <Link to={user ? "/" : "/signin"}>
                <span>{user ? "Open Console" : "Broker Sign In"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-24">
        <Badge variant="brand" className="mb-4 px-3 py-1">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          <span>Propatyc Broker — Site Visit Console</span>
        </Badge>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Coordinate verified property visits with speed &amp; clarity.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          The dedicated workspace for Propatyc field brokers and superbrokers to claim owner-approved site visits, lock 3-way meetings, and guide buyers &amp; property owners in person.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="brand" size="lg" asChild>
            <Link to={user ? "/" : "/signin"}>
              <span>{user ? "Launch Dashboard" : "Sign In to Console"}</span>
              <ArrowRight className="size-4.5" aria-hidden="true" />
            </Link>
          </Button>
          {!user ? (
            <Button variant="outline" size="lg" asChild>
              <Link to="/signup">Register as Broker</Link>
            </Button>
          ) : null}
        </div>
      </section>

      {/* Workflow Bento */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} className="justify-between">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-extrabold tracking-widest text-muted-foreground">
                      STEP {s.step}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{s.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-border/70 bg-card/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Propatyc · Site Visit Console</p>
          <div className="flex items-center gap-5 font-medium">
            <Link to="/termsandcondition" className="hover:text-foreground">
              Terms &amp; Conditions
            </Link>
            <Link to="/privacyandpolicy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
