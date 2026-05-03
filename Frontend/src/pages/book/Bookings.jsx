import React, { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../contexts/AppContext";
import { Link } from "react-router-dom";
import {
  Building2,
  Bookmark,
  CalendarDays,
  LayoutGrid,
  Loader2,
  Plus,
} from "lucide-react";
import Properties from "../../components/Properties";
import api from "../../api/client";

const TAB_CONFIG = [
  {
    type: "myProperties",
    backType: null,
    label: "My listings",
    description: "Properties you manage",
    icon: LayoutGrid,
  },
  {
    type: "bookedProperties",
    backType: "propId",
    label: "Booked",
    description: "Your reservations",
    icon: CalendarDays,
  },
  {
    type: "saved",
    backType: null,
    label: "Saved",
    description: "Properties you saved",
    icon: Bookmark,
  },
];

const EMPTY_COPY = {
  myProperties: {
    text: "You haven't listed any properties yet.",
    cta: { label: "Add a property", to: "/add-property" },
  },
  bookedProperties: {
    text: "When you book a visit or stay, it will appear here.",
    cta: { label: "Browse properties", to: "/" },
  },
  saved: {
    text: "Save properties while browsing to compare them later.",
    cta: { label: "Browse properties", to: "/" },
  },
};

const Bookings = () => {
  const { user } = useContext(AppContext);
  const [myProp, setMyProp] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const fetchTab = useCallback(
    async (tabType, backType) => {
      if (!user?.[tabType]?.length) {
        setMyProp([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.post("/api/fetching/get-user-property", {
          Type: tabType,
          NestedPop: backType,
        });
        setMyProp(res.status === 200 ? res.data.properties || [] : []);
      } catch {
        setMyProp([]);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab.type);
    fetchTab(tab.type, tab.backType);
  };

  useEffect(() => {
    if (!user || initialLoadDone) return;
    const first = TAB_CONFIG[0];
    setActiveTab(first.type);
    setInitialLoadDone(true);
    if (user[first.type]?.length > 0) fetchTab(first.type, first.backType);
    else setMyProp([]);
  }, [user, initialLoadDone, fetchTab]);

  const activeMeta = TAB_CONFIG.find((t) => t.type === activeTab);
  const countForTab = activeTab && user?.[activeTab] ? user[activeTab].length : 0;

  return (
    <div className="min-h-screen  pt-20 pb-20">
      <div className="max-w-5xl mx-auto ">

        {/* Page header */}
        <div className="flex items-center justify-between py-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              My Space
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Listings, bookings, and saved properties
            </p>
          </div>
          {/* <Link
            to="/add-property"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add property
          </Link> */}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-zinc-200 mb-8">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.type;
            const count = user?.[tab.type]?.length ?? 0;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {!user ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-zinc-300" />
            <p className="text-sm text-zinc-400">Loading your account…</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1  gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-100 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-zinc-100" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : countForTab === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
              {activeMeta?.icon && (
                <activeMeta.icon className="w-6 h-6 text-zinc-400" />
              )}
            </div>
            <p className="text-zinc-500 text-sm max-w-xs mb-5">
              {EMPTY_COPY[activeTab]?.text}
            </p>
            {EMPTY_COPY[activeTab]?.cta && (
              <Link
                to={EMPTY_COPY[activeTab].cta.to}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-zinc-700 transition-colors"
              >
                {activeTab === "myProperties" && <Plus className="w-4 h-4" />}
                {EMPTY_COPY[activeTab].cta.label}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1  gap-5 pb-8">
            {myProp.map((item, index) =>
              item.propId ? (
                <Properties
                  key={item.propId._id || index}
                  prop={item.propId}
                />
              ) : (
                <div
                  key={index}
                  className="rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center"
                >
                  <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-600">
                    Property no longer available
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    It may have been removed by the owner.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;