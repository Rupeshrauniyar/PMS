import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Building2,
  CalendarCheck,
  Sparkles,
  Download,
  Compass,
  Film,
  ArrowRight,
} from "lucide-react";

import { getApiBase } from "../utils/apiBase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Intro = () => {
  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      {/* Top Bar */}
      <header className="chrome-fixed-top glass fixed inset-x-0 top-0 z-40 border-b border-border/70 pt-safe">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/web-app-manifest-512x512.png"
              alt="Propatyc logo"
              width={36}
              height={36}
              className="size-9 rounded-xl object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight">
              Propatyc
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`${getApiBase()}/api/android/getapk`} download>
                <Download className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Android App</span>
              </a>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link to="/">
                <Compass className="size-4" aria-hidden="true" />
                <span>Explore</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-32 pb-16 text-center sm:px-6 sm:pt-40">
        <Badge variant="brand" className="mb-4 gap-1.5 px-3.5 py-1">
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span>Walkthrough Video Tours &amp; Coordinated Site Visits</span>
        </Badge>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
        >
          Buy, Sell &amp; Rent Properties with Confidence
        </motion.h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Watch real walkthrough videos before stepping outside, connect with verified owners, and let Propatyc brokers coordinate seamless in-person site visits.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="brand" size="lg">
            <Link to="/">
              <span>Browse Properties</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/add-property">List Your Property</Link>
          </Button>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pb-20 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border/80 bg-card p-7 shadow-card md:col-span-2">
          <div>
            <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Film className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              50 MB Walkthrough Video Tours
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Experience full room-by-room video walkthroughs right on every listing so you only travel to properties you truly love.
            </p>
          </div>
          <div>
            <Button asChild variant="brand" size="sm">
              <Link to="/search">Explore video tours</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border/80 bg-card p-7 shadow-soft">
          <div>
            <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <Home className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">Houses, Rooms &amp; Plots</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Smart search and instant filters for budget, rooms, and locality.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border/80 bg-card p-7 shadow-soft">
          <div>
            <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">Effortless Owner Tools</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Publish in 4 guided steps and manage visit approvals from one dashboard.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border/80 bg-card p-7 shadow-card md:col-span-2">
          <div>
            <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-success-soft text-success">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              3-Party Coordinated Site Visits
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pick up to 3 preferred time slots. Once the owner approves, a dedicated Propatyc broker schedules the meet and sends calendar invites.
            </p>
          </div>
          <div>
            <Button asChild variant="outline" size="sm">
              <Link to="/visits">View site visits</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-base font-extrabold">Propatyc</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Modern real estate discovery &amp; visit coordination.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-semibold text-muted-foreground">
            <Link to="/privacyandpolicy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/termsandcondition" className="hover:text-foreground">
              Terms &amp; Conditions
            </Link>
            <Link to="/" className="hover:text-foreground">
              Explore Listings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Intro;
