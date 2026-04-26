import axios from "axios";
import { Building2, Search as SearchIcon, X } from "lucide-react";
import React, { useState } from "react";
import Properties from "../../components/Properties";

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

const Search = () => {
  const [value, setValue] = useState("");
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setValue(query);

    if (!query.trim()) {
      setProps([]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/fetching/search`,
        { value: query }
      );
      setProps(res.data.props || []);
    } catch {
      setProps([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setValue("");
    setProps([]);
  };

  return (
    <div className="w-full min-h-screen bg-white pt-20 pb-16">

      {/* ── Search Bar ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">
          Search
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={handleSearch}
            className="w-full py-3.5 pl-11 pr-10 rounded-2xl border border-zinc-200 bg-white text-sm text-black placeholder-zinc-400 outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
            placeholder="Search houses, rooms, plots…"
            autoFocus
          />
          {value && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {!value.trim() ? (
        /* Empty prompt */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <SearchIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600">
            Start typing to search
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Search by location, type, or keyword
          </p>
        </div>
      ) : loading ? (
        /* Skeleton */
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            Searching…
          </p>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : props.length > 0 ? (
        /* Results */
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
            Results · {props.length}
          </p>
          {props.map((prop, i) => (
            <Properties prop={prop} key={i} />
          ))}
        </div>
      ) : (
        /* No results */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600">No results found</p>
          <p className="text-xs text-zinc-400 mt-1">
            Try a different keyword or location
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;