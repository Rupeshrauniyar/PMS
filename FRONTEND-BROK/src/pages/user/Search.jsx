import api from "../../api/client";
import {
  Building2,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  MapPin,
} from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Properties from "../../components/Properties";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

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

const SkeletonCard = () => (
  <div className="border border-zinc-100 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-video bg-zinc-100 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-zinc-100 rounded-full w-3/4" />
      <div className="h-3 bg-zinc-100 rounded-full w-1/2" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-zinc-100 rounded-full" />
        ))}
      </div>
      <div className="pt-2 border-t border-zinc-100 flex justify-between">
        <div className="h-4 bg-zinc-100 rounded-full w-24" />
        <div className="h-3 bg-zinc-100 rounded-full w-16" />
      </div>
    </div>
  </div>
);

function parseNumLocal(v) {
  const s = String(v ?? "").replace(/,/g, "").trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function buildFiltersPayload(filters) {
  const out = {};
  if (filters.location?.trim())
    out.location = filters.location.trim();
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
  if (keywordTrim.length >= 3) return true;
  return Object.keys(filtersObj).length > 0;
}

const Search = () => {
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const debouncedKey = useDebouncedValue(searchKey, 400);

  useEffect(() => {
    let cancelled = false;
    const { keyword: kRaw, filters: fRaw } = JSON.parse(debouncedKey);
    const k = (kRaw || "").trim();
    const fd = typeof fRaw === "object" && fRaw !== null ? fRaw : {};
    const mergedFilters = buildFiltersPayload({
      ...DEFAULT_FILTERS,
      ...fd,
    });

    if (!hasPayloadCriteria(k, mergedFilters)) {
      setProps([]);
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
        if (!cancelled) setProps(res.data.props || []);
      } catch (e) {
        if (!cancelled) {
          setProps([]);
          setError("Search failed. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedKey]);

  const setFilterField = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = () => {
    setKeyword("");
    setFilters({ ...DEFAULT_FILTERS });
    setProps([]);
    setError(null);
  };

  const clearKeyword = () => {
    setKeyword("");
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.location.trim()) n++;
    if (parseNumLocal(filters.priceMin) != null) n++;
    if (parseNumLocal(filters.priceMax) != null) n++;
    if (parseNumLocal(filters.roomsMin) != null) n++;
    if (parseNumLocal(filters.roomsMax) != null) n++;
    if (parseNumLocal(filters.washroomsMin) != null) n++;
    if (filters.sellingType) n++;
    if (filters.propertyType) n++;
    return n;
  }, [filters]);

  const debouncedParsed = JSON.parse(debouncedKey);
  const kDebounced = (debouncedParsed.keyword || "").trim();
  const mergedNow = buildFiltersPayload({
    ...DEFAULT_FILTERS,
    ...debouncedParsed.filters,
  });
  const awaitingInput = !hasPayloadCriteria(kDebounced, mergedNow);

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-white px-4 pt-20 pb-16">
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">
          Search listings
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full py-3.5 pl-11 pr-24 rounded-2xl border border-zinc-200 bg-white text-sm text-black placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            placeholder="Keywords · e.g. under 6000, 2 bhk Kathmandu"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-label="Toggle filters"
              onClick={() => setFiltersOpen((o) => !o)}
              className="relative px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-black text-white text-[10px] leading-none flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            {keyword ? (
              <button
                type="button"
                onClick={clearKeyword}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors shrink-0"
                aria-label="Clear keyword"
              >
                <X className="w-3 h-3 text-zinc-500" />
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-zinc-400">
          Smart search reads phrases like &quot;between 4000 and 6000&quot; · use filters for exact
          ranges
        </p>
      </div>

      {filtersOpen && (
        <div className="mb-8 p-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <MapPin className="w-4 h-4 text-zinc-500" />
              Refine results
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="text-xs font-medium text-zinc-600 hover:text-black underline underline-offset-2"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-500">Location</span>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilterField("location", e.target.value)}
                placeholder="City, street, locality…"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-500">Min price (रू)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={filters.priceMin}
                  onChange={(e) => setFilterField("priceMin", e.target.value)}
                  placeholder="4000"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-500">Max price (रू)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={filters.priceMax}
                  onChange={(e) => setFilterField("priceMax", e.target.value)}
                  placeholder="6000"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-500">Rooms (range)</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={filters.roomsMin}
                  onChange={(e) => setFilterField("roomsMin", e.target.value)}
                  placeholder="Min"
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={filters.roomsMax}
                  onChange={(e) => setFilterField("roomsMax", e.target.value)}
                  placeholder="Max"
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-500">
                Minimum washrooms (optional)
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={filters.washroomsMin}
                onChange={(e) =>
                  setFilterField("washroomsMin", e.target.value)
                }
                placeholder="Any"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-500">Listing type</span>
              <select
                value={filters.sellingType}
                onChange={(e) => setFilterField("sellingType", e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="">Any</option>
                <option value="Rent System">Rent</option>
                <option value="Selling System">Sale</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-500">Property type</span>
              <select
                value={filters.propertyType}
                onChange={(e) =>
                  setFilterField("propertyType", e.target.value)
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="">Any</option>
                <option value="House">House</option>
                <option value="Room">Room</option>
                <option value="Plot">Plot</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {keyword || activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={clearAll}
          className="mb-6 text-xs font-medium text-zinc-600 hover:text-black underline underline-offset-2"
        >
          Clear search &amp; filters
        </button>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      ) : null}

      {awaitingInput ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <SearchIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600">
            Enter at least three characters — or open filters for price &amp; location
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Example: keywords &quot;Lalitpur&quot; or filters &quot;4000&quot;–&quot;6000&quot;
            only
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            Searching…
          </p>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : props.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            Results · {props.length}
          </p>
          {props.map((prop) =>
            prop?._id ? <Properties prop={prop} key={prop._id} /> : null,
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600">No results found</p>
          <p className="text-xs text-zinc-400 mt-1">
            Widen the price range or try different keywords
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
