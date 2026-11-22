import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Building2 } from "lucide-react";

import api from "../../api/client";
import Properties, { PropertyCardSkeleton } from "../../components/Properties";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "All", label: "All" },
  { id: "House", label: "House" },
  { id: "Room", label: "Room" },
  { id: "Plot", label: "Plot" },
];

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadFeed = async () => {
      setLoading(true);
      try {
        const payload =
          activeCategory === "All"
            ? { recent: true, limit: 100 }
            : { type: activeCategory, limit: 100 };

        const res = await api.post("/api/fetching/get-property", payload);
        if (!cancelled) {
          const raw = res?.status === 200 ? res.data?.Properties || [] : [];
          setListings(raw.filter((p) => p?._id));
        }
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFeed();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="flex flex-col gap-7 py-5 sm:py-7">
      {/* Minimal Category Pill Bar */}
      <div className="flex items-center justify-center">
        <div
          role="tablist"
          aria-label="Property category"
          className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary/60 p-1"
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "relative inline-flex h-9 items-center justify-center rounded-full px-5 text-[13.5px] font-semibold transition-colors outline-none",
                  active
                    ? "text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="home-cat-pill"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                    className="absolute inset-0 rounded-full bg-foreground"
                  />
                ) : null}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Uniform Property Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <Properties key={item._id} prop={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          action={
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/add-property">
                <Plus className="size-4" aria-hidden="true" />
                <span>Add property</span>
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
};

export default Home;
