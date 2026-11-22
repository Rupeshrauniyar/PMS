import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Download,
  Film,
  Globe,
  Layers,
  Lock,
  MapPin,
  Menu,
  Moon,
  Play,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { AppContext } from "../contexts/AppContext";
import { getApiBase } from "../utils/apiBase";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#why-propatyc", label: "Why Propatyc" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "#workflow", label: "How It Works" },
  { href: "#payments", label: "Payments" },
  { href: "#mobile", label: "Android" },
  { href: "#faq", label: "FAQ" },
];

const METRICS = [
  {
    value: "50 MB",
    label: "HD Walkthrough Video",
    detail: "Room-by-room tours streamed per listing",
  },
  {
    value: "3-Party",
    label: "Synchronized Visits",
    detail: "Buyer, owner & broker aligned on one invite",
  },
  {
    value: "3 Modes",
    label: "Verified Nepal Checkout",
    detail: "eSewa v2, Khalti / ConnectIPS & Cash",
  },
  {
    value: "24h & 1h",
    label: "Automated Reminders",
    detail: "Push, in-app & .ics calendar alerts",
  },
];

const COMPARISON_ROWS = [
  {
    dimension: "Evaluating a listing",
    legacy: "3 blurry photos; hours wasted commuting across traffic just to see small rooms.",
    propatyc: "Stream up to 50 MB room-by-room HD walkthrough videos before stepping outside.",
  },
  {
    dimension: "Scheduling a visit",
    legacy: "Endless phone tag between buyer, landlord, and informal street middlemen.",
    propatyc: "Propose up to 3 preferred slots; owner approves once; a verified broker locks the meet.",
  },
  {
    dimension: "Phone & WhatsApp privacy",
    legacy: "Public phone numbers scraped for spam calls even after a property is rented.",
    propatyc: "Numbers stay gated on the server and unlock only for approved, broker-claimed tours.",
  },
  {
    dimension: "On-site accountability",
    legacy: "Unannounced no-shows, vague landmarks, and zero record of what was agreed.",
    propatyc: "Exact Google Maps pin, downloadable .ics invite, 24h/1h reminders & audit timeline.",
  },
  {
    dimension: "Booking & deposits",
    legacy: "Informal transfers or unreceipted cash with no verification against the listing.",
    propatyc: "HMAC-SHA256 & server-verified eSewa, Khalti / ConnectIPS, or recorded Pay-at-Property.",
  },
];

const ROLES = {
  buyer: {
    id: "buyer",
    label: "Buyers & Tenants",
    eyebrow: "Discover with certainty",
    headline: "Inspect every corner on video. Tour in person without friction.",
    summary:
      "Whether you are renting a flat in Lalitpur, buying a family home, or acquiring land, Propatyc replaces guesswork with verified media, structured site tours, and cryptographic payment receipts.",
    ctaLabel: "Browse Properties",
    ctaTo: "/",
    secondaryLabel: "Search & Filter",
    secondaryTo: "/search",
    points: [
      {
        title: "Watch before you travel",
        desc: "Every listing supports high-definition walkthrough video alongside multi-angle photo galleries so you shortlist from home.",
      },
      {
        title: "Free 3-slot visit requests",
        desc: "Submit up to 3 convenient dates and times—site visits are completely free and never lock you into a payment.",
      },
      {
        title: "Dedicated field coordinator",
        desc: "Once the owner approves, a verified Propatyc broker coordinates the landmark, sends .ics invites, and meets you on site.",
      },
      {
        title: "Instant verified settlement",
        desc: "Pay confirmed reservations via eSewa Wallet, Khalti, Mobile Banking, ConnectIPS, or choose Pay at Property.",
      },
    ],
    preview: {
      badge: "Buyer Experience",
      title: "Sunny 3BHK Apartment · Jhamsikhel",
      meta: "रू 35,000 / month · 3 Rooms · 2 Baths · 1,350 sq.ft",
      rows: [
        { k: "Walkthrough Video", v: "02:14 HD Tour Ready" },
        { k: "Site Visit Status", v: "Confirmed · Sat, 11:00 AM" },
        { k: "Meeting Point", v: "Main Gate near St. Mary's, Jhamsikhel" },
        { k: "Assigned Broker", v: "Verified Coordinator · Calendar (.ics) Ready" },
      ],
    },
  },
  owner: {
    id: "owner",
    label: "Property Owners",
    eyebrow: "Publish & control effortlessly",
    headline: "Serious, pre-qualified visitors—without surrendering your phone number.",
    summary:
      "List Houses, Rooms, or Plots for Sale or Rent from a single clean studio. Your walkthrough video pre-qualifies buyers automatically while Propatyc brokers handle on-ground tours.",
    ctaLabel: "List a Property",
    ctaTo: "/add-property",
    secondaryLabel: "Manage My Listings",
    secondaryTo: "/profile",
    points: [
      {
        title: "Single-screen listing studio",
        desc: "Upload photos, attach a 50 MB walkthrough video, set NPR pricing, and publish or edit anytime without multi-step bloat.",
      },
      {
        title: "One-tap visit & booking gatekeeping",
        desc: "Approve or decline buyer visit requests and reservation requests on your terms before any broker is dispatched.",
      },
      {
        title: "Zero cold-call spam",
        desc: "Your personal contact details are never exposed on public listings—only shared with the assigned coordinator for approved visits.",
      },
      {
        title: "Real-time payment & tour alerts",
        desc: "Receive instant notifications the moment a tour is scheduled, completed, or settled via eSewa / Khalti.",
      },
    ],
    preview: {
      badge: "Owner Control Panel",
      title: "Listing Performance & Approvals",
      meta: "Full visibility across visits, reservations & payouts",
      rows: [
        { k: "Listing Media", v: "6 Photos + 42 MB Video Live" },
        { k: "Contact Privacy", v: "Shielded from Public Feed" },
        { k: "Pending Visit Request", v: "3 Buyer Time Slots Proposed" },
        { k: "Reservation Settlement", v: "Verified via eSewa · Ref #000AWEO" },
      ],
    },
  },
  broker: {
    id: "broker",
    label: "Brokers & Superbrokers",
    eyebrow: "Dedicated Broker Console",
    headline: "Claim live approved tours, lock 3-way schedules, and close faster.",
    summary:
      "Propatyc gives field coordinators and superbrokers a dedicated web and native Android console—eliminating cold outreach so you focus purely on owner-approved, high-intent site visits.",
    ctaLabel: "Explore Marketplace",
    ctaTo: "/",
    secondaryLabel: "Download Android App",
    secondaryHref: "apk",
    points: [
      {
        title: "Race-safe Open Request Pool",
        desc: "Owner-approved visits enter a live FIFO queue; atomic claiming guarantees two brokers never collide on the same request.",
      },
      {
        title: "1-tap 3-Party Contact Hub",
        desc: "Claiming unlocks direct Call, pre-filled WhatsApp, and Email triggers for both the buyer and property owner.",
      },
      {
        title: "7-day agenda & .ics dispatch",
        desc: "Pick one of the buyer's preferred slots, set duration (15–90 min) & landmark, and notify all 3 parties instantly.",
      },
      {
        title: "Superbroker organization oversight",
        desc: "Superbrokers monitor organization-wide active queues and reassign visits live whenever schedules shift.",
      },
    ],
    preview: {
      badge: "Broker Console · Live Pool",
      title: "3-Party Visit Coordination",
      meta: "Atomic queue · Direct WhatsApp · Outcome logging",
      rows: [
        { k: "Open Pool Queue", v: "Owner-Approved · Ready to Claim" },
        { k: "Contact Hub", v: "Buyer & Owner Tel / WhatsApp Unlocked" },
        { k: "Schedule Dispatch", v: "30 min Tour · Maps + .ics Sent" },
        { k: "Completion Window", v: "Outcome & No-Show Guard Active" },
      ],
    },
  },
};

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Discover & Watch in HD",
    desc: "Buyers filter verified Houses, Rooms, and Plots by location, budget, and amenities—watching full 50 MB walkthrough videos before shortlisting.",
  },
  {
    step: "02",
    title: "Request Free Visit or Reserve",
    desc: "Propose up to 3 preferred date/time slots with a note for a free physical inspection, or submit a direct reservation request.",
  },
  {
    step: "03",
    title: "Owner Approves in One Tap",
    desc: "The property owner reviews the request and approves it—automatically dispatching the visit into the live Propatyc Broker Pool.",
  },
  {
    step: "04",
    title: "Broker Claims & Locks the Meet",
    desc: "A verified Propatyc broker claims the visit, confirms availability with both parties, and sets the exact time, duration, and landmark.",
  },
  {
    step: "05",
    title: "Guided Tour & Verified Payment",
    desc: "All 3 parties receive 24h & 1h reminders, Google Maps directions, and .ics invites—followed by cryptographically verified eSewa/Khalti checkout.",
  },
];

const FAQS = [
  {
    q: "What exactly is Propatyc and why is it different from classified ad sites?",
    a: "Classified portals stop at static photos and public phone numbers—leaving buyers to commute to disappointing properties and owners to deal with endless spam calls. Propatyc is an end-to-end transaction platform combining 50 MB HD video walkthroughs, owner-approved 3-party broker-coordinated site visits, private contact protection, and cryptographically verified Nepal digital payments.",
  },
  {
    q: "Are in-person property site visits free to request?",
    a: "Yes. Requesting a site visit on Propatyc is 100% free. Buyers select up to 3 preferred future time slots, and payment is only ever requested when you decide to reserve a property and the owner confirms your booking.",
  },
  {
    q: "How does the 3-party site visit coordination work between buyer, owner, and broker?",
    a: "When a buyer requests a tour, the owner receives an instant alert. Once the owner approves, the visit enters the Propatyc Broker Open Pool. A verified broker claims it, unlocks direct phone/WhatsApp access to both buyer and owner, locks the exact meeting time and landmark, and dispatches confirmation + calendar (.ics) invites + 24h/1h reminders to all three participants.",
  },
  {
    q: "How are eSewa and Khalti payments verified for security?",
    a: "Propatyc never trusts client-side browser redirects alone. Every eSewa ePay v2 payment is verified using timing-safe HMAC-SHA256 signature validation plus a server-to-server call to eSewa's Transaction Status API. Every Khalti / ConnectIPS payment is verified server-to-server via Khalti's Lookup API with exact NPR-to-paisa amount matching before marking a booking paid.",
  },
  {
    q: "Can I upload walkthrough videos directly from my phone?",
    a: "Yes. Both the web studio and the native Propatyc Android app let property owners upload up to 50 MB of walkthrough video (MP4, WebM, MOV) alongside multiple photos. Videos stream smoothly with automatic thumbnails and lazy playback.",
  },
  {
    q: "How does Propatyc protect my phone number and email address?",
    a: "Public property pages never expose raw owner IDs or personal phone numbers. Contact details remain hidden even while a visit sits in the Open Pool, and are revealed strictly to the assigned coordinator and relevant parties once a visit is actively claimed.",
  },
  {
    q: "What property types and transaction models are supported?",
    a: "Propatyc supports Houses, Rooms/Flats, and Land Plots across both Rent System (monthly rentals) and Selling System (outright property sales) throughout Nepal, complete with NPR formatting and local landmarks.",
  },
];

function BrandMark({ className }) {
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

const Intro = () => {
  const { user } = useContext(AppContext);
  const { theme, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [activeRole, setActiveRole] = useState("buyer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const apkUrl = `${getApiBase()}/api/android/getapk`;
  const roleData = ROLES[activeRole] || ROLES.buyer;

  const heroMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div className="min-h-svh w-full bg-background text-foreground selection:bg-foreground selection:text-background">
      {/* =================================================================== */}
      {/* EXECUTIVE STICKY HEADER                                             */}
      {/* =================================================================== */}
      <header className="chrome-fixed-top glass fixed inset-x-0 top-0 z-50 border-b border-border/70 pt-safe">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <BrandMark />
              <span className="text-[17px] font-extrabold tracking-[-0.035em]">
                Propatyc
              </span>
            </Link>

            <nav aria-label="Page sections" className="hidden items-center gap-6 lg:flex">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 text-foreground transition-colors hover:bg-accent"
            >
              {theme === "dark" ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden rounded-full px-3.5 sm:inline-flex"
            >
              <a href={apkUrl} download>
                <Download className="size-3.5" aria-hidden="true" />
                <span>Android APK</span>
              </a>
            </Button>

            {user ? (
              <Button asChild size="sm" className="rounded-full px-4">
                <Link to="/">
                  <span>Open App</span>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden rounded-full md:inline-flex"
                >
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-4">
                  <Link to="/">
                    <span>Explore</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-controls="intro-mobile-nav"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 text-foreground hover:bg-accent lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Menu className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen ? (
          <nav
            id="intro-mobile-nav"
            aria-label="Mobile page navigation"
            className="border-t border-border/70 bg-background px-4 py-4 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/60"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <a href={apkUrl} download onClick={() => setMobileMenuOpen(false)}>
                    <Download className="size-3.5" aria-hidden="true" />
                    <span>Download APK</span>
                  </a>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link
                    to={user ? "/add-property" : "/signin"}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {user ? "List Property" : "Sign In"}
                  </Link>
                </Button>
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      {/* =================================================================== */}
      {/* HERO + ARCHITECTURAL CONSOLE SHOWCASE                               */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden border-b border-border/70 pt-28 pb-16 sm:pt-36 sm:pb-24">
        {/* Subtle monochrome architectural grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.035] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_25%,#000_55%,transparent_100%)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...heroMotion} className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-semibold tracking-tight text-foreground">
              <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>Real Estate Infrastructure for Nepal · Web &amp; Native Android</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-6xl lg:text-[4.35rem] lg:leading-[1.04]">
              Watch the walkthrough.
              <br />
              Meet on site. Settle with certainty.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Propatyc unifies high-definition 50 MB property video tours, owner-approved
              3-party broker site visits, shielded contact privacy, and cryptographically
              verified eSewa &amp; Khalti payments into one seamless platform.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/">
                  <span>Explore Properties</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                <Link to="/add-property">List a Property</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full px-5">
                <a href={apkUrl} download>
                  <Download className="size-4" aria-hidden="true" />
                  <span>Get Android App</span>
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Architectural Product Window Mockup */}
          <div className="mt-14 rounded-3xl border border-border bg-card p-3 shadow-card sm:mt-16 sm:p-5">
            <div className="flex items-center justify-between border-b border-border/70 px-2 pb-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-border bg-secondary" />
                <span className="size-2.5 rounded-full border border-border bg-secondary" />
                <span className="size-2.5 rounded-full border border-border bg-secondary" />
                <span className="ml-2 font-mono text-[11px] text-foreground/80">
                  propatyc.app / unified-property-os
                </span>
              </div>
              <span className="hidden font-medium sm:inline">
                End-to-End Verified Lifecycle
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: Video Walkthrough Stage */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-secondary/35 p-5 lg:col-span-7">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[11px] font-bold text-background">
                    <Play className="size-3 fill-current" aria-hidden="true" />
                    <span>HD Walkthrough Tour · 50 MB Stream</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    16:10 Adaptive Player
                  </span>
                </div>

                <div className="my-6 space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Modern 4BHK Residence · Budhanilkantha
                    </p>
                    <p className="text-lg font-extrabold tabular-nums text-foreground">
                      रू 4,25,00,000
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    House · Selling System · 4 Rooms · 3 Washrooms · 2,400 sq.ft · Parking &amp; Solar
                  </p>

                  {/* Simulated Video Timeline Bar */}
                  <div className="pt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div className="h-full w-2/3 rounded-full bg-foreground" />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
                      <span>01:38 · Living, Kitchen &amp; Terrace</span>
                      <span>02:24 HD</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Media</p>
                    <p className="font-semibold text-foreground">Video + 8 Photos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner Number</p>
                    <p className="font-semibold text-foreground">Privacy Shielded</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Site Tour</p>
                    <p className="font-semibold text-foreground">Free · 3 Slots</p>
                  </div>
                </div>
              </div>

              {/* Right: 3-Party Coordinator + Payment Verification Stack */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      3-Party Visit Pipeline
                    </p>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                      Scheduled
                    </span>
                  </div>

                  <ol className="mt-4 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                    {["Requested", "Approved", "Broker", "Scheduled"].map((step, i) => (
                      <li
                        key={step}
                        className="rounded-xl border border-foreground bg-foreground px-1.5 py-2 font-semibold text-background"
                      >
                        <span className="block font-mono text-[10px] opacity-75">
                          0{i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4 space-y-1.5 rounded-xl bg-secondary/50 p-3 text-xs">
                    <p className="font-semibold text-foreground">
                      Confirmed Meet · Sun, 10:30 AM – 11:15 AM
                    </p>
                    <p className="text-muted-foreground">
                      Landmark: Narayanthan Chowk Gate · Buyer, Owner &amp; Broker notified (.ics)
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Verified Nepal Settlement
                    </p>
                    <ShieldCheck className="size-4 text-foreground" aria-hidden="true" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["eSewa ePay v2", "Khalti Wallet", "ConnectIPS", "Pay at Property"].map(
                      (gw) => (
                        <span
                          key={gw}
                          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground"
                        >
                          {gw}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Cryptographic <code className="font-mono text-foreground">HMAC-SHA256</code>{" "}
                    validation + real-time gateway status lookup before issuing digital receipts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Metric Architectural Strip */}
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {METRICS.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-border/80 bg-card/60 p-5"
              >
                <dt className="text-xs font-semibold text-muted-foreground">{m.label}</dt>
                <dd className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {m.value}
                </dd>
                <p className="mt-1 text-xs text-muted-foreground">{m.detail}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* =================================================================== */}
      {/* WHY PROPATYC IS USEFUL — PROBLEM VS SOLUTION                        */}
      {/* =================================================================== */}
      <section
        id="why-propatyc"
        aria-labelledby="why-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Why Propatyc Exists
            </p>
            <h2
              id="why-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
            >
              Property hunting in Nepal was broken. We re-engineered every step.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Traditional listings leave buyers commuting across cities for misleading photos,
              expose landlords to relentless cold calls, and rely on informal cash handovers.
              Propatyc replaces friction with verifiable digital infrastructure.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-border">
            <div className="hidden grid-cols-12 border-b border-border bg-secondary/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
              <div className="col-span-3">Stage</div>
              <div className="col-span-4">Traditional Classifieds &amp; Street Brokers</div>
              <div className="col-span-5 text-foreground">The Propatyc Standard</div>
            </div>

            <div className="divide-y divide-border">
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.dimension}
                  className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-12 md:items-center md:gap-6 md:px-6"
                >
                  <div className="md:col-span-3">
                    <p className="text-sm font-bold text-foreground">{row.dimension}</p>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-sm text-muted-foreground">{row.legacy}</p>
                  </div>
                  <div className="flex items-start gap-2.5 md:col-span-5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="size-3 stroke-[2.5]" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-medium text-foreground">{row.propatyc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CORE CAPABILITIES BENTO GRID                                        */}
      {/* =================================================================== */}
      <section
        id="capabilities"
        aria-labelledby="capabilities-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Platform Capabilities
              </p>
              <h2
                id="capabilities-heading"
                className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
              >
                Everything required to list, inspect, coordinate, and close.
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit rounded-full px-5">
              <Link to="/search">
                <span>Explore Live Inventory</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-6">
            {/* Large Card 1 */}
            <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Film className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">01 / MEDIA</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                  50 MB Room-by-Room Walkthrough Videos
                </h3>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Static photos hide street noise, natural light, and room proportions. Property
                  owners upload up to 50 MB of high-definition video directly alongside photo
                  galleries—streamed via Cloudinary with instant thumbnails and bandwidth-smart
                  lazy loading when buyers open the listing.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border/70 pt-5 text-xs font-semibold text-foreground">
                <span className="rounded-full bg-secondary px-3 py-1">MP4 / WebM / MOV</span>
                <span className="rounded-full bg-secondary px-3 py-1">Auto Poster Frame</span>
                <span className="rounded-full bg-secondary px-3 py-1">Fullscreen Playback</span>
              </div>
            </article>

            {/* Card 2 */}
            <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                    <Lock className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">02 / PRIVACY</span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                  Gated Contact Protection
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Raw owner IDs, phone numbers, and emails are stripped from public APIs and
                  open broker pools—unlocking only when a visit is approved and actively claimed.
                </p>
              </div>
              <p className="mt-6 border-t border-border/70 pt-4 text-xs font-medium text-muted-foreground">
                Zero public number scraping
              </p>
            </article>

            {/* Card 3 */}
            <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                    <Search className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">03 / DISCOVERY</span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                  Precision Search &amp; Filters
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Filter Houses, Rooms, and Plots across Rent &amp; Sale systems by locality,
                  NPR budget range, bedroom count, and verified amenities in real time.
                </p>
              </div>
              <p className="mt-6 border-t border-border/70 pt-4 text-xs font-medium text-muted-foreground">
                Houses · Rooms · Plots
              </p>
            </article>

            {/* Large Card 4 */}
            <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                    <CalendarCheck className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    04 / COORDINATION
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                  3-Party Broker-Synchronized Site Visits
                </h3>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Buyers pick up to 3 preferred slots. Once approved by the owner, a verified
                  Propatyc broker claims the request from a race-safe queue, coordinates with
                  both parties, locks the meeting point, and sends instant calendar (.ics) &amp;
                  Google Maps links to all three attendees.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border/70 pt-5 text-xs font-semibold text-foreground">
                <span className="rounded-full bg-secondary px-3 py-1">Atomic Pool Claim</span>
                <span className="rounded-full bg-secondary px-3 py-1">.ics Calendar Invite</span>
                <span className="rounded-full bg-secondary px-3 py-1">24h &amp; 1h Reminders</span>
                <span className="rounded-full bg-secondary px-3 py-1">Superbroker Oversight</span>
              </div>
            </article>

            {/* Card 5 */}
            <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                    <Wallet className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">05 / FINTECH</span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                  eSewa, Khalti, ConnectIPS &amp; Pay-at-Property
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Built natively for Nepal&apos;s digital payment rails with server-to-server
                  lookup reconciliation, tamper-proof HMAC signatures, and instant buyer/owner
                  receipt notifications.
                </p>
              </div>
            </article>

            {/* Card 6 */}
            <article className="flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                    <Zap className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">06 / REALTIME</span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
                  Native Push Alerts &amp; Universal Deep Links
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Firebase Cloud Messaging (FCM) delivers instant mobile alerts on every booking,
                  pool release, schedule update, or payment—tapping any alert opens the exact
                  screen inside the app.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* INTERACTIVE 3-ROLE ECOSYSTEM EXPLORER                               */}
      {/* =================================================================== */}
      <section
        id="ecosystem"
        aria-labelledby="ecosystem-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Three-Sided Marketplace
              </p>
              <h2
                id="ecosystem-heading"
                className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
              >
                Purpose-built tools for every participant.
              </h2>
            </div>

            {/* Role Switcher */}
            <div
              role="tablist"
              aria-label="Select platform role"
              className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-secondary/50 p-1"
            >
              {Object.values(ROLES).map((r) => {
                const selected = activeRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveRole(r.id)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-xs font-bold transition-colors sm:text-sm",
                      selected
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Detail Panel */}
          <div className="mt-10 grid grid-cols-1 gap-8 rounded-3xl border border-border bg-card p-6 sm:p-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-7">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {roleData.eyebrow}
                </p>
                <h3 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {roleData.headline}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {roleData.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {roleData.points.map((pt) => (
                  <div
                    key={pt.title}
                    className="rounded-2xl border border-border/80 bg-background p-4"
                  >
                    <p className="text-sm font-bold text-foreground">{pt.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {pt.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button asChild className="rounded-full px-6">
                  <Link to={roleData.ctaTo}>
                    <span>{roleData.ctaLabel}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                {roleData.secondaryHref === "apk" ? (
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <a href={apkUrl} download>
                      <Download className="size-4" aria-hidden="true" />
                      <span>{roleData.secondaryLabel}</span>
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={roleData.secondaryTo}>{roleData.secondaryLabel}</Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Live Role Card */}
            <div className="rounded-2xl border border-border bg-background p-6 lg:col-span-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-bold text-background">
                  {roleData.preview.badge}
                </span>
                <CheckCircle2 className="size-4 text-foreground" aria-hidden="true" />
              </div>

              <div className="mt-4">
                <p className="text-lg font-bold text-foreground">{roleData.preview.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{roleData.preview.meta}</p>
              </div>

              <dl className="mt-5 divide-y divide-border/70 border-t border-border/70 text-xs">
                {roleData.preview.rows.map((r) => (
                  <div key={r.k} className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-muted-foreground">{r.k}</dt>
                    <dd className="text-right font-semibold text-foreground">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5-STAGE END-TO-END WORKFLOW                                         */}
      {/* =================================================================== */}
      <section
        id="workflow"
        aria-labelledby="workflow-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              End-to-End Architecture
            </p>
            <h2
              id="workflow-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
            >
              From first video play to verified handover in five steps.
            </h2>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WORKFLOW_STEPS.map((item) => (
              <li
                key={item.step}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6"
              >
                <div>
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-foreground font-mono text-xs font-bold text-background">
                    {item.step}
                  </span>
                  <h3 className="mt-5 text-base font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =================================================================== */}
      {/* PAYMENTS, TRUST & SECURITY                                          */}
      {/* =================================================================== */}
      <section
        id="payments"
        aria-labelledby="payments-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-5 lg:col-span-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Production-Grade Settlement &amp; Security
              </p>
              <h2
                id="payments-heading"
                className="text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
              >
                Nepal&apos;s trusted payment rails—verified cryptographically on the server.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Once a property owner confirms your reservation, settle seamlessly in Nepalese
                Rupees (`रू`) using your preferred wallet or bank—or record an in-person
                handover—backed by strict double-verification against gateway APIs.
              </p>

              <ul className="space-y-3 pt-2 text-sm">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold text-foreground">eSewa ePay v2:</strong>{" "}
                    <span className="text-muted-foreground">
                      Timing-safe <code className="font-mono text-xs">HMAC-SHA256</code> signature
                      verification paired with eSewa&apos;s Server Status Check endpoint.
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold text-foreground">
                      Khalti, Mobile Banking &amp; ConnectIPS:
                    </strong>{" "}
                    <span className="text-muted-foreground">
                      Server-to-server <code className="font-mono text-xs">pidx</code> lookup
                      enforcing exact paisa amount parity and idempotent receipts.
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold text-foreground">
                      Dual-Token Session Security:
                    </strong>{" "}
                    <span className="text-muted-foreground">
                      Short-lived access JWTs, rotating refresh tokens, Google OAuth2{" "}
                      <code className="font-mono text-xs">idToken</code> verification, and
                      rate-limited endpoints across Web and Android.
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-6">
              <div className="rounded-3xl border border-border bg-card p-6">
                <Wallet className="size-6 text-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-base font-bold text-foreground">eSewa Wallet</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Instant digital checkout with signed transaction UUIDs and automatic
                  reconciliation even if a browser tab closes early.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <Smartphone className="size-6 text-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-base font-bold text-foreground">
                  Khalti &amp; ConnectIPS
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Pay via Khalti Wallet, Nepali e-banking, SCT cards, or ConnectIPS with
                  verified transaction reference receipts.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <Building2 className="size-6 text-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-base font-bold text-foreground">Pay at Property</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Prefer settling via bank cheque or cash during key handover? Log it formally
                  so both buyer and owner stay aligned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* NATIVE ANDROID SUITE                                                */}
      {/* =================================================================== */}
      <section
        id="mobile"
        aria-labelledby="mobile-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 rounded-3xl border border-border bg-secondary/35 p-7 sm:p-12 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                <Smartphone className="size-3.5" aria-hidden="true" />
                <span>Native Android Applications</span>
              </div>
              <h2
                id="mobile-heading"
                className="text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
              >
                Two dedicated Android apps—built for buyers, owners, and field brokers.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Install the Propatyc Android app for instant FCM push notifications, native
                one-tap Google Sign-In, camera/gallery video uploads, hardware back-gesture
                navigation, and universal links that open shared properties directly in the app.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full px-6">
                  <a href={apkUrl} download>
                    <Download className="size-4" aria-hidden="true" />
                    <span>Download Propatyc Android APK</span>
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                  <Link to="/signup">Create Web Account</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
              <div className="rounded-2xl border border-border bg-background p-5">
                <Users className="size-5 text-foreground" aria-hidden="true" />
                <p className="mt-3 text-base font-bold text-foreground">Propatyc User App</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Browse listings, stream HD video tours, request 3-slot visits, manage your
                  properties, and pay with eSewa or Khalti on the go.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <UserCheck className="size-5 text-foreground" aria-hidden="true" />
                <p className="mt-3 text-base font-bold text-foreground">Propatyc Broker App</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Real-time Open Pool alerts, 1-tap Call &amp; WhatsApp coordination, 7-day tour
                  calendar, and on-site visit completion tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ACCESSIBLE NATIVE FAQ ACCORDION                                     */}
      {/* =================================================================== */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="cv-below-fold scroll-mt-20 border-b border-border/70 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Frequently Asked Questions
            </p>
            <h2
              id="faq-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl"
            >
              Clear answers before you make a move.
            </h2>
          </div>

          <div className="intro-accordion mt-12 divide-y divide-border rounded-3xl border border-border bg-card">
            {FAQS.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-7 sm:py-5">
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

      {/* =================================================================== */}
      {/* CLOSING CTA BANNER                                                  */}
      {/* =================================================================== */}
      <section className="cv-below-fold py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12 sm:py-20">
            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              Ready to experience modern real estate in Nepal?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-80 sm:text-base">
              Explore verified Houses, Rooms, and Plots with full walkthrough videos—or list
              your property in minutes and let Propatyc handle the coordination.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background px-7 text-foreground hover:bg-background/90"
              >
                <Link to="/">
                  <span>Start Exploring</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-background/30 bg-transparent px-7 text-background hover:bg-background/10 hover:text-background"
              >
                <Link to={user ? "/add-property" : "/signup"}>
                  {user ? "List a Property" : "Create Free Account"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ENTERPRISE MULTI-COLUMN FOOTER                                      */}
      {/* =================================================================== */}
      <footer className="border-t border-border bg-card/50 pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 pb-12 md:grid-cols-6">
            {/* Brand Column */}
            <div className="col-span-2 space-y-4 pr-4">
              <Link to="/" className="inline-flex items-center gap-2.5 text-foreground">
                <BrandMark />
                <span className="text-lg font-extrabold tracking-[-0.035em]">Propatyc</span>
              </Link>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                Unified property discovery, 50 MB HD video walkthroughs, 3-party broker-led
                site visits, and verified digital payments across Nepal.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="size-3.5" aria-hidden="true" />
                <span>Nepal · NPR (रू) · Asia/Kathmandu</span>
              </div>
            </div>

            {/* Marketplace */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Marketplace
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-foreground">
                    Explore Properties
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="hover:text-foreground">
                    Advanced Search
                  </Link>
                </li>
                <li>
                  <Link to="/add-property" className="hover:text-foreground">
                    List a Property
                  </Link>
                </li>
                <li>
                  <Link to="/visits" className="hover:text-foreground">
                    Site Visits
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Architecture
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="#why-propatyc" className="hover:text-foreground">
                    Why Propatyc
                  </a>
                </li>
                <li>
                  <a href="#capabilities" className="hover:text-foreground">
                    Video &amp; Visit Engine
                  </a>
                </li>
                <li>
                  <a href="#ecosystem" className="hover:text-foreground">
                    3-Party Ecosystem
                  </a>
                </li>
                <li>
                  <a href="#payments" className="hover:text-foreground">
                    eSewa &amp; Khalti Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Account & Apps */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Access
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/signin" className="hover:text-foreground">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-foreground">
                    Create Account
                  </Link>
                </li>
                <li>
                  <a href={apkUrl} download className="hover:text-foreground">
                    Download Android APK
                  </a>
                </li>
                <li>
                  <Link to="/themes" className="hover:text-foreground">
                    Appearance ({theme === "dark" ? "Dark" : "Light"})
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Governance
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/privacyandpolicy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/termsandcondition" className="hover:text-foreground">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="hover:text-foreground">
                    Settings
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Propatyc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <span>50 MB HD Video Walkthroughs</span>
              <span aria-hidden="true">·</span>
              <span>3-Party Verified Visits</span>
              <span aria-hidden="true">·</span>
              <span>eSewa &amp; Khalti Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Intro;
