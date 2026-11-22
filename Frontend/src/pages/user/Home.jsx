import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  LayoutGrid,
  Play,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("All");
  const [sellingFilter, setSellingFilter] = useState(""); // "" | "Rent System" | "Selling System"
  const [videoOnly, setVideoOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "price_asc" | "price_desc" | "popular"
  const [quickQuery, setQuickQuery] = useState("");
  const [compactMobileGrid, setCompactMobileGrid] = useState(true);

  const [listings, setListings] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadFeed = async () => {
      setLoading(true);
      try {
        const payload = {
          recent: true,
          limit: 120,
          includeCounts: true,
          ...(activeCategory !== "All" ? { type: activeCategory } : {}),
          ...(sellingFilter ? { sellingType: sellingFilter } : {}),
          ...(videoOnly ? { withVideo: true } : {}),
          ...(sortBy !== "newest" ? { sort: sortBy } : {}),
        };

        const res = await api.post("/api/fetching/get-property", payload);
        if (!cancelled) {
          const raw = res?.status === 200 ? res.data?.Properties || [] : [];
          setListings(raw.filter((p) => p?._id));
          if (res?.data?.counts) {
            setCounts(res.data.counts);
          }
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
  }, [activeCategory, sellingFilter, videoOnly, sortBy]);

  const visibleListings = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((p) => {
      const hay = [
        p.title,
        p.location,
        p.propertyType,
        p.sellingType === "Rent System" ? "rent" : "sale",
        ...(Array.isArray(p.amenities) ? p.amenities : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [listings, quickQuery]);

  const hasActiveRefinements =
    activeCategory !== "All" ||
    Boolean(sellingFilter) ||
    videoOnly ||
    Boolean(quickQuery.trim());

  const resetAllFilters = () => {
    setActiveCategory("All");
    setSellingFilter("");
    setVideoOnly(false);
    setQuickQuery("");
    setSortBy("newest");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = quickQuery.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeCategory !== "All") params.set("propertyType", activeCategory);
    if (sellingFilter) params.set("sellingType", sellingFilter);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const gridClass = compactMobileGrid
    ? "grid grid-cols-2 gap-x-3.5 gap-y-6 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4"
    : "grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="flex flex-col gap-6 py-4 pb-10 sm:py-6">
      {/* =================================================================== */}
      {/* EDITORIAL MARKETPLACE HEADER + INSTANT SEARCH                       */}
      {/* =================================================================== */}
      <section className="flex flex-col gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground sm:text-3xl">
              Explore Properties
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {counts?.All != null
                ? `${counts.All} verified ${counts.All === 1 ? "listing" : "listings"} · Houses, Rooms & Plots across Nepal`
                : "Verified Houses, Rooms & Plots with video tours"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/intro"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span>How it works</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-full px-3.5 sm:hidden"
            >
              <Link to="/add-property">
                <Plus className="size-3.5" aria-hidden="true" />
                <span>List</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Instant Search & Filter Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2"
          role="search"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Search location, title, or amenity (e.g. Kathmandu, 2BHK, WiFi)..."
              aria-label="Filter or search properties"
              className="h-11 w-full rounded-full border border-border bg-card pr-9 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            {quickQuery ? (
              <button
                type="button"
                onClick={() => setQuickQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/search")}
            className="h-11 shrink-0 rounded-full px-4"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </form>

        {/* Single-Row Scrollable Category Tabs + Quick Refinements */}
        <div className="flex items-center justify-between gap-3">
          <div className="scrollbar-hide -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 py-0.5">
            <div
              role="tablist"
              aria-label="Property category"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/80 bg-secondary/50 p-1"
            >
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                const catCount = counts?.[cat.id];
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-[13px]",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{cat.label}</span>
                    {catCount != null ? (
                      <span
                        className={cn(
                          "tabular-nums text-[11px]",
                          active ? "opacity-80" : "opacity-65",
                        )}
                      >
                        {catCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border" />

            {/* Rent / Sale / Video Quick Pills */}
            <button
              type="button"
              aria-pressed={sellingFilter === "Rent System"}
              onClick={() =>
                setSellingFilter((prev) =>
                  prev === "Rent System" ? "" : "Rent System",
                )
              }
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition-colors",
                sellingFilter === "Rent System"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              For Rent
            </button>

            <button
              type="button"
              aria-pressed={sellingFilter === "Selling System"}
              onClick={() =>
                setSellingFilter((prev) =>
                  prev === "Selling System" ? "" : "Selling System",
                )
              }
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition-colors",
                sellingFilter === "Selling System"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              For Sale
            </button>

            <button
              type="button"
              aria-pressed={videoOnly}
              onClick={() => setVideoOnly((v) => !v)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
                videoOnly
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <Play className="size-3 fill-current" aria-hidden="true" />
              <span>Video Tour</span>
            </button>
          </div>

          {/* Sort + Mobile Density Toggle */}
          <div className="flex shrink-0 items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort properties"
              className="hidden h-8 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-foreground sm:inline-block"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            <button
              type="button"
              onClick={() => setCompactMobileGrid((v) => !v)}
              aria-label={
                compactMobileGrid
                  ? "Switch to single-column cards"
                  : "Switch to 2-column grid"
              }
              className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
            >
              {compactMobileGrid ? (
                <Rows3 className="size-4" aria-hidden="true" />
              ) : (
                <LayoutGrid className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* MULTI-COLUMN PROPERTY GRID                                          */}
      {/* =================================================================== */}
      {loading ? (
        <div className={gridClass}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleListings.length > 0 ? (
        <div className={gridClass}>
          {visibleListings.map((item) => (
            <Properties key={item._id} prop={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={
            hasActiveRefinements
              ? `No ${activeCategory !== "All" ? activeCategory.toLowerCase() : ""} properties match these filters`
              : "No properties listed yet"
          }
          description={
            hasActiveRefinements
              ? "Try switching back to All categories or clearing active filters."
              : "Be the first to publish a verified listing with walkthrough video."
          }
          action={
            hasActiveRefinements ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="rounded-full px-5"
                >
                  Show all properties
                </Button>
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link to="/add-property">
                    <Plus className="size-4" aria-hidden="true" />
                    <span>List {activeCategory !== "All" ? activeCategory : "property"}</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="rounded-full px-5">
                <Link to="/add-property">
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Add property</span>
                </Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );
};

export default Home;
