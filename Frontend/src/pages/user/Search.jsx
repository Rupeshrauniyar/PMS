import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react";

import api from "../../api/client";
import Properties, { PropertyCardSkeleton } from "../../components/Properties";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCompactPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS = {
  location: "",
  priceMin: "",
  priceMax: "",
  roomsMin: "",
  roomsMax: "",
  washroomsMin: "",
  sellingType: "",
  propertyType: "",
};

const QUICK_TYPE_CHIPS = [
  { label: "All", propertyType: "", sellingType: "" },
  { label: "House", propertyType: "House" },
  { label: "Room", propertyType: "Room" },
  { label: "Plot", propertyType: "Plot" },
  { label: "For Rent", sellingType: "Rent System" },
  { label: "For Sale", sellingType: "Selling System" },
];

function parseNumLocal(v) {
  const s = String(v ?? "").replace(/,/g, "").trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function buildFiltersPayload(filters) {
  const out = {};
  if (filters.location?.trim()) out.location = filters.location.trim();
  const pmin = parseNumLocal(filters.priceMin);
  const pmax = parseNumLocal(filters.priceMax);
  if (pmin != null) out.priceMin = pmin;
  if (pmax != null) out.priceMax = pmax;
  const rmin = parseNumLocal(filters.roomsMin);
  const rmax = parseNumLocal(filters.roomsMax);
  if (rmin != null) out.roomsMin = rmin;
  if (rmax != null) out.roomsMax = rmax;
  const wash = parseNumLocal(filters.washroomsMin);
  if (wash != null) out.washroomsMin = wash;
  if (filters.sellingType) out.sellingType = filters.sellingType;
  if (filters.propertyType) out.propertyType = filters.propertyType;
  return out;
}

function hasPayloadCriteria(keywordTrim, filtersObj) {
  if (keywordTrim.length >= 2) return true;
  return Object.keys(filtersObj).length > 0;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(() => searchParams.get("q") || "");
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    propertyType: searchParams.get("propertyType") || "",
    sellingType: searchParams.get("sellingType") || "",
    location: searchParams.get("location") || "",
  }));

  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);

  const [results, setResults] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync draft filters whenever sheet opens
  useEffect(() => {
    if (sheetOpen) setDraftFilters(filters);
  }, [sheetOpen, filters]);

  // Load initial recent listings for zero-query state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSuggestedLoading(true);
      try {
        const res = await api.post("/api/fetching/get-property", {
          recent: true,
          limit: 9,
        });
        if (!cancelled) {
          setSuggested(res?.data?.Properties || []);
        }
      } catch {
        if (!cancelled) setSuggested([]);
      } finally {
        if (!cancelled) setSuggestedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchKey = useMemo(
    () =>
      JSON.stringify({
        keyword: keyword.trim(),
        filters: {
          ...filters,
          location: filters.location.trim(),
        },
      }),
    [keyword, filters],
  );

  const debouncedKey = useDebouncedValue(searchKey, 350);

  useEffect(() => {
    let cancelled = false;
    const { keyword: kRaw, filters: fRaw } = JSON.parse(debouncedKey);
    const k = (kRaw || "").trim();
    const mergedFilters = buildFiltersPayload({
      ...DEFAULT_FILTERS,
      ...(fRaw || {}),
    });

    if (!hasPayloadCriteria(k, mergedFilters)) {
      setResults([]);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.post("/api/fetching/search", {
          value: k || "",
          filters: mergedFilters,
        });
        if (!cancelled) {
          setResults(res.data?.props || []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Could not complete search. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedKey]);

  const removeFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  }, []);

  const clearAll = useCallback(() => {
    setKeyword("");
    setFilters({ ...DEFAULT_FILTERS });
    setResults([]);
    setError(null);
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activePills = useMemo(() => {
    const pills = [];
    if (filters.propertyType) {
      pills.push({ key: "propertyType", label: filters.propertyType });
    }
    if (filters.sellingType) {
      pills.push({
        key: "sellingType",
        label: filters.sellingType === "Rent System" ? "For Rent" : "For Sale",
      });
    }
    if (filters.location.trim()) {
      pills.push({ key: "location", label: `Near ${filters.location.trim()}` });
    }
    if (parseNumLocal(filters.priceMin) != null) {
      pills.push({
        key: "priceMin",
        label: `Min ${formatCompactPrice(filters.priceMin)}`,
      });
    }
    if (parseNumLocal(filters.priceMax) != null) {
      pills.push({
        key: "priceMax",
        label: `Max ${formatCompactPrice(filters.priceMax)}`,
      });
    }
    if (parseNumLocal(filters.roomsMin) != null) {
      pills.push({ key: "roomsMin", label: `${filters.roomsMin}+ rooms` });
    }
    if (parseNumLocal(filters.roomsMax) != null) {
      pills.push({ key: "roomsMax", label: `≤${filters.roomsMax} rooms` });
    }
    if (parseNumLocal(filters.washroomsMin) != null) {
      pills.push({ key: "washroomsMin", label: `${filters.washroomsMin}+ baths` });
    }
    return pills;
  }, [filters]);

  const debouncedParsed = JSON.parse(debouncedKey);
  const kDebounced = (debouncedParsed.keyword || "").trim();
  const mergedNow = buildFiltersPayload({
    ...DEFAULT_FILTERS,
    ...debouncedParsed.filters,
  });
  const isIdle = !hasPayloadCriteria(kDebounced, mergedNow);

  const applySheetFilters = () => {
    setFilters(draftFilters);
    setSheetOpen(false);
  };

  const resetDraft = () => {
    setDraftFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <div className="flex flex-col gap-6 py-5 sm:py-8">
      {/* Sticky Search Header */}
      <div className="sticky top-[calc(var(--safe-top)+var(--app-topbar-h))] z-20 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3.5 backdrop-blur-xl sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search keywords — e.g. 2BHK Kathmandu, under 18000…"
              aria-label="Search listings"
              className="pl-10 pr-9"
            />
            {keyword ? (
              <button
                type="button"
                onClick={() => setKeyword("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <Button
            variant={activePills.length > 0 ? "default" : "outline"}
            onClick={() => setSheetOpen(true)}
            className="shrink-0 gap-2"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
            {activePills.length > 0 ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
                {activePills.length}
              </span>
            ) : null}
          </Button>
        </div>

        {/* Quick Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {QUICK_TYPE_CHIPS.map((chip) => {
            const isAll = chip.label === "All";
            const active = isAll
              ? !filters.propertyType && !filters.sellingType
              : chip.propertyType
                ? filters.propertyType === chip.propertyType
                : filters.sellingType === chip.sellingType;

            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  if (isAll) {
                    setFilters((p) => ({ ...p, propertyType: "", sellingType: "" }));
                  } else if (chip.propertyType) {
                    setFilters((p) => ({
                      ...p,
                      propertyType:
                        p.propertyType === chip.propertyType ? "" : chip.propertyType,
                    }));
                  } else if (chip.sellingType) {
                    setFilters((p) => ({
                      ...p,
                      sellingType:
                        p.sellingType === chip.sellingType ? "" : chip.sellingType,
                    }));
                  }
                }}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Active Filter Pills */}
        {activePills.length > 0 || keyword.trim() ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
            {activePills.map((pill) => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
              >
                <span>{pill.label}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(pill.key)}
                  aria-label={`Remove ${pill.label} filter`}
                  className="inline-flex size-4 items-center justify-center rounded-full hover:bg-brand/20"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              <span>Clear all</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Error Message */}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </div>
      ) : null}

      {/* Main Content */}
      {isIdle ? (
        <section className="flex flex-col gap-4">
          {suggestedLoading ? (
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : suggested.filter((p) => p?._id).length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {suggested
                .filter((p) => p?._id)
                .map((prop) => (
                  <Properties key={prop._id} prop={prop} />
                ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchIcon}
              title="Search properties"
              action={
                <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  <span>Filters</span>
                </Button>
              }
            />
          )}
        </section>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : results.filter((p) => p?._id).length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            {results.filter((p) => p?._id).length} results
          </p>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {results
              .filter((p) => p?._id)
              .map((prop) => (
                <Properties key={prop._id} prop={prop} />
              ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No matches"
          action={
            <Button variant="outline" size="sm" onClick={clearAll} className="rounded-full px-5">
              Reset
            </Button>
          }
        />
      )}

      {/* Filters Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filter properties"
        description="Narrow down listings by type, price, rooms, and locality."
        footer={
          <>
            <Button variant="outline" onClick={resetDraft}>
              Reset
            </Button>
            <Button variant="brand" onClick={applySheetFilters}>
              Show results
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Property type">
              <Select
                value={draftFilters.propertyType}
                onChange={(e) =>
                  setDraftFilters((p) => ({ ...p, propertyType: e.target.value }))
                }
              >
                <option value="">Any type</option>
                <option value="House">House</option>
                <option value="Room">Room</option>
                <option value="Plot">Plot</option>
              </Select>
            </Field>

            <Field label="Listing type">
              <Select
                value={draftFilters.sellingType}
                onChange={(e) =>
                  setDraftFilters((p) => ({ ...p, sellingType: e.target.value }))
                }
              >
                <option value="">Rent or Buy</option>
                <option value="Rent System">For Rent</option>
                <option value="Selling System">For Sale</option>
              </Select>
            </Field>
          </div>

          <Field label="Location / Locality">
            <Input
              type="text"
              value={draftFilters.location}
              onChange={(e) =>
                setDraftFilters((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="e.g., Lazimpat, Lalitpur, Pokhara…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min price (Rs.)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={draftFilters.priceMin}
                onChange={(e) =>
                  setDraftFilters((p) => ({ ...p, priceMin: e.target.value }))
                }
                placeholder="5,000"
              />
            </Field>
            <Field label="Max price (Rs.)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={draftFilters.priceMax}
                onChange={(e) =>
                  setDraftFilters((p) => ({ ...p, priceMax: e.target.value }))
                }
                placeholder="50,000"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min rooms">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={draftFilters.roomsMin}
                onChange={(e) =>
                  setDraftFilters((p) => ({ ...p, roomsMin: e.target.value }))
                }
                placeholder="Any"
              />
            </Field>
            <Field label="Min washrooms">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={draftFilters.washroomsMin}
                onChange={(e) =>
                  setDraftFilters((p) => ({ ...p, washroomsMin: e.target.value }))
                }
                placeholder="Any"
              />
            </Field>
          </div>
        </div>
      </Sheet>
    </div>
  );
};

export default Search;
