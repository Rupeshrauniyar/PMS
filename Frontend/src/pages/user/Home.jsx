import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Play,
  ArrowUpRight,
  Plus,
  Building2,
} from "lucide-react";

import api from "../../api/client";
import Properties, { PropertyCardSkeleton } from "../../components/Properties";
import { VideoPlayer } from "@/components/ui/video-player";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "All", label: "All" },
  { id: "House", label: "Houses" },
  { id: "Room", label: "Rooms" },
  { id: "Plot", label: "Plots" },
];

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sellingFilter, setSellingFilter] = useState(""); // "" | "Rent System" | "Selling System"
  const [onlyVideo, setOnlyVideo] = useState(false);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadFeed = async () => {
      setLoading(true);
      try {
        let res;
        if (activeCategory === "All") {
          res = await api.post("/api/fetching/get-property", {
            recent: true,
            limit: 30,
            ...(sellingFilter ? { sellingType: sellingFilter } : {}),
            ...(onlyVideo ? { withVideo: true } : {}),
          });
        } else {
          res = await api.post("/api/fetching/get-property", {
            type: activeCategory,
          });
        }

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
  }, [activeCategory, sellingFilter, onlyVideo]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (sellingFilter && item.sellingType !== sellingFilter) return false;
      if (onlyVideo && !item?.video?.url) return false;
      return true;
    });
  }, [listings, sellingFilter, onlyVideo]);

  // Lead video tour residence (featured cleanly at top when available on All/Video view)
  const spotlight = useMemo(() => {
    if (activeCategory !== "All" && !onlyVideo) return null;
    return filteredListings.find((p) => Boolean(p?.video?.url)) || null;
  }, [filteredListings, activeCategory, onlyVideo]);

  const galleryItems = useMemo(() => {
    if (!spotlight) return filteredListings;
    const rest = filteredListings.filter((p) => String(p._id) !== String(spotlight._id));
    return rest.length > 0 ? rest : filteredListings;
  }, [filteredListings, spotlight]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <div className="flex flex-col gap-8 py-5 sm:gap-10 sm:py-7">
      {/* Minimal Monochrome Command & Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Switcher + Mode Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div
            role="tablist"
            aria-label="Property type"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border/80 bg-secondary/60 p-1"
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
                    "relative inline-flex h-8 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-colors outline-none",
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

          <div className="h-5 w-px shrink-0 bg-border/70" aria-hidden="true" />

          {/* Rent / Buy / Video monochrome pills */}
          <button
            type="button"
            onClick={() =>
              setSellingFilter((v) => (v === "Rent System" ? "" : "Rent System"))
            }
            aria-pressed={sellingFilter === "Rent System"}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
              sellingFilter === "Rent System"
                ? "border-foreground bg-foreground text-background"
                : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            Rent
          </button>

          <button
            type="button"
            onClick={() =>
              setSellingFilter((v) =>
                v === "Selling System" ? "" : "Selling System",
              )
            }
            aria-pressed={sellingFilter === "Selling System"}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
              sellingFilter === "Selling System"
                ? "border-foreground bg-foreground text-background"
                : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            Buy
          </button>

          <button
            type="button"
            onClick={() => setOnlyVideo((v) => !v)}
            aria-pressed={onlyVideo}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
              onlyVideo
                ? "border-foreground bg-foreground text-background"
                : "border-border/80 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            <Play className="size-3 fill-current" aria-hidden="true" />
            <span>Video tours</span>
          </button>
        </div>

        {/* Minimal Search Input */}
        <form
          onSubmit={handleSearch}
          className="flex w-full items-center gap-2 lg:w-80 xl:w-96"
        >
          <div className="relative flex flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location, budget, rooms…"
              aria-label="Search properties"
              className="h-10 w-full rounded-full border border-border/80 bg-secondary/40 pl-9 pr-4 text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-foreground focus:bg-background"
            />
          </div>
          <Link
            to="/search"
            aria-label="Advanced filters"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-foreground transition-colors hover:bg-accent"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </Link>
        </form>
      </div>

      {/* Cinema Walkthrough Spotlight (only when a video listing exists) */}
      {!loading && spotlight ? (
        <section className="relative overflow-hidden rounded-3xl bg-black text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <VideoPlayer
                src={spotlight.video.url}
                poster={spotlight.video.thumbnail || spotlight.images?.[0]}
                aboveFold
                autoPlayInView
                aspectClassName="aspect-[16/10] sm:aspect-[16/9] lg:h-full lg:aspect-auto min-h-[260px]"
              />
            </div>

            <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-4 lg:p-9">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">
                  <span className="size-1.5 rounded-full bg-white" />
                  <span>Featured Walkthrough</span>
                </div>

                <h2 className="text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
                  {spotlight.title}
                </h2>

                {spotlight.location ? (
                  <p className="text-sm text-white/70">{spotlight.location}</p>
                ) : null}

                {spotlight.description ? (
                  <p className="line-clamp-3 pt-1 text-sm leading-relaxed text-white/60">
                    {spotlight.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/15 pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-white/55">
                    {spotlight.sellingType === "Rent System" ? "Monthly" : "Asking"}
                  </span>
                  <span className="text-xl font-bold tracking-tight text-white tabular-nums">
                    {formatPrice(spotlight.price)}
                  </span>
                </div>

                <Link
                  to={`/view/${spotlight._id}`}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition-transform hover:bg-white/90 active:scale-[0.98]"
                >
                  <span>Explore &amp; Book Visit</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Frameless Architectural Gallery */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : galleryItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <Properties key={item._id} prop={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No matching residences"
            description={
              onlyVideo || sellingFilter || activeCategory !== "All"
                ? "Clear active filters to browse all available listings."
                : "Publish the first listing with photos and a walkthrough video."
            }
            action={
              onlyVideo || sellingFilter || activeCategory !== "All" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-5"
                  onClick={() => {
                    setActiveCategory("All");
                    setSellingFilter("");
                    setOnlyVideo(false);
                  }}
                >
                  Reset filters
                </Button>
              ) : (
                <Button asChild variant="default" size="sm" className="rounded-full px-5">
                  <Link to="/add-property">
                    <Plus className="size-4" aria-hidden="true" />
                    <span>List a property</span>
                  </Link>
                </Button>
              )
            }
          />
        )}
      </section>
    </div>
  );
};

export default Home;
