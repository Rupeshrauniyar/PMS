import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Download,
  Globe,
  Inbox,
  Lock,
  Moon,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/lib/theme";
import { getApiBase } from "@/utils/apiBase";
import { Button } from "@/components/ui/button";
import { BrokerBrand } from "@/components/broker/BrokerBrand";

const CAPABILITIES = [
  {
    step: "01",
    icon: Inbox,
    title: "Race-Safe Open Request Pool",
    description:
      "Every request in the pool has already been approved by the property owner. Atomic MongoDB claiming guarantees two brokers never collide on the same visit.",
  },
  {
    step: "02",
    icon: PhoneCall,
    title: "Protected 3-Party Contact Hub",
    description:
      "Claiming a visit unlocks one-tap Call, pre-filled WhatsApp, and Email links for both the buyer and owner—keeping numbers private while unassigned.",
  },
  {
    step: "03",
    icon: CalendarCheck,
    title: "Instant 3-Way Scheduling & .ics",
    description:
      "Tap a buyer's preferred time slot, set the tour duration (15–90 min) and landmark, and dispatch Google Maps + .ics calendar invites + 24h/1h reminders.",
  },
  {
    step: "04",
    icon: ShieldCheck,
    title: "Superbroker Team Oversight",
    description:
      "Superbrokers gain an organization-wide live view across every active broker queue with instant visit reassignment when field schedules shift.",
  },
];

const BROKER_FAQS = [
  {
    q: "How do property visits enter the Propatyc Broker Pool?",
    a: "When a buyer watches a property walkthrough on Propatyc and submits up to 3 preferred visit slots, the property owner reviews the request first. Only owner-approved visits enter the Broker Open Pool—so you never waste time chasing unverified leads.",
  },
  {
    q: "What happens if two brokers tap Claim at the exact same moment?",
    a: "Propatyc uses an atomic server-side claim transition. Exactly one broker wins the assignment and unlocks contact details, while any concurrent request receives a clean conflict notice and refreshes automatically.",
  },
  {
    q: "What if my schedule changes after claiming a visit?",
    a: "Before scheduling a confirmed meet, you can release a claimed visit back to the Open Pool with an optional note so another field coordinator can pick it up seamlessly.",
  },
  {
    q: "When can a visit be marked Completed or No-Show?",
    a: "Completion and no-show reporting unlock starting 1 hour before the scheduled meeting start time, ensuring accurate, auditable tour records for buyers and owners.",
  },
];

export default function Intro() {
  const { user } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const apkUrl = `${getApiBase()}/api/android/getapk`;

  return (
    <div className="min-h-svh w-full bg-background text-foreground selection:bg-foreground selection:text-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to={user ? "/" : "/signin"} className="outline-none">
              <BrokerBrand />
            </Link>
            <nav aria-label="Broker page sections" className="hidden items-center gap-6 md:flex">
              <a
                href="#capabilities"
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                Capabilities
              </a>
              <a
                href="#workflow"
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                Workflow
              </a>
              <a
                href="#faq"
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-accent"
            >
              {isDark ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </button>

            <Button asChild size="sm" className="rounded-full px-4">
              <Link to={user ? "/" : "/signin"}>
                <span>{user ? "Open Console" : "Broker Sign In"}</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70 py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.035] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_25%,#000_55%,transparent_100%)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-semibold text-foreground">
            <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
            <span>Propatyc Broker Network · Web &amp; Native Android Console</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-6xl">
            Coordinate owner-approved property tours with zero friction.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Purpose-built for Propatyc field coordinators and superbrokers. Claim live
            owner-approved visit requests, unlock verified buyer &amp; owner contacts, lock
            3-way meetings, and guide high-intent tours on site.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to={user ? "/" : "/signin"}>
                <span>{user ? "Launch Dashboard" : "Sign In to Console"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            {!user ? (
              <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                <Link to="/signup">Create Broker Account</Link>
              </Button>
            ) : null}
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
            {[
              { k: "Lead Quality", v: "100%", d: "Owner-approved before pool entry" },
              { k: "Queue Safety", v: "Atomic", d: "Zero double-claim race conditions" },
              { k: "Coordination", v: "3-Party", d: "Buyer, owner & broker synced" },
              { k: "Reminders", v: "24h & 1h", d: "Automated push & .ics alerts" },
            ].map((m) => (
              <div key={m.k} className="rounded-2xl border border-border bg-card p-5">
                <dt className="text-xs font-semibold text-muted-foreground">{m.k}</dt>
                <dd className="mt-1 text-2xl font-extrabold text-foreground">{m.v}</dd>
                <p className="mt-1 text-xs text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Capabilities */}
      <section
        id="capabilities"
        aria-labelledby="broker-cap-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Console Capabilities
            </p>
            <h2
              id="broker-cap-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
            >
              Engineered for field speed and accountability.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.step}
                  className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.step}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-foreground">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        aria-labelledby="broker-flow-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="broker-flow-heading"
            className="text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
          >
            Why brokers prefer Propatyc
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Pre-qualified by 50 MB video",
                desc: "Buyers have already watched the walkthrough video and reviewed specs—meaning every tour you conduct is with a genuinely interested prospect.",
              },
              {
                title: "One-tap mobile field tools",
                desc: "Open Google Maps directions, trigger pre-filled WhatsApp messages, and check your 7-day calendar strip directly from your phone.",
              },
              {
                title: "Complete audit trail",
                desc: "Every claim, reschedule, release, completion note, and no-show is timestamped so buyers, owners, and brokers stay aligned.",
              },
            ].map((b) => (
              <div key={b.title} className="rounded-3xl border border-border bg-card p-6">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{b.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        aria-labelledby="broker-faq-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2
            id="broker-faq-heading"
            className="text-center text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
          >
            Broker FAQ
          </h2>
          <div className="intro-accordion mt-10 divide-y divide-border rounded-3xl border border-border bg-card">
            {BROKER_FAQS.map((item) => (
              <details key={item.q} className="px-5 py-4 sm:px-7 sm:py-5">
                <summary className="flex cursor-pointer items-center gap-3 text-left text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg sm:text-base">
                  <ChevronDown
                    className="accordion-chevron size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>{item.q}</span>
                </summary>
                <p className="pt-3 pl-7 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 pb-10 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <BrokerBrand />
              <p className="max-w-sm text-xs text-muted-foreground">
                Dedicated field coordination console for verified Propatyc property site visits
                across Nepal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-muted-foreground">
              <Link to={user ? "/" : "/signin"} className="hover:text-foreground">
                {user ? "Dashboard" : "Sign In"}
              </Link>
              {!user ? (
                <Link to="/signup" className="hover:text-foreground">
                  Register
                </Link>
              ) : null}
              <Link to="/termsandcondition" className="hover:text-foreground">
                Terms &amp; Conditions
              </Link>
              <Link to="/privacyandpolicy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <a href={apkUrl} download className="hover:text-foreground">
                Android App
              </a>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Propatyc Broker Network. All rights reserved.</p>
            <div className="inline-flex items-center gap-2">
              <Globe className="size-3.5" aria-hidden="true" />
              <span>Nepal · Asia/Kathmandu</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
