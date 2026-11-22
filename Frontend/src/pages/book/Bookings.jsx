import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Bookmark,
  CalendarDays,
  CalendarCheck,
  LayoutGrid,
  Plus,
  CreditCard,
  ArrowRight,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import Properties, { PropertyCardSkeleton } from "../../components/Properties";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill } from "@/components/ui/visit-status";

const TAB_CONFIG = [
  {
    value: "myProperties",
    backType: null,
    label: "My listings",
    icon: LayoutGrid,
  },
  {
    value: "bookedProperties",
    backType: "propId",
    label: "Bookings",
    icon: CalendarDays,
  },
  {
    value: "saved",
    backType: null,
    label: "Saved",
    icon: Bookmark,
  },
];

const EMPTY_COPY = {
  myProperties: {
    title: "You haven't listed any properties yet",
    description: "Publish a room, house, or plot with photos and an optional video walkthrough.",
    cta: { label: "List a property", to: "/add-property" },
  },
  bookedProperties: {
    title: "No reservations yet",
    description: "Properties you reserve or request site visits for will appear here.",
    cta: { label: "Explore properties", to: "/" },
  },
  saved: {
    title: "No saved properties yet",
    description: "Tap the bookmark icon on any listing to save it for easy comparison.",
    cta: { label: "Browse listings", to: "/search" },
  },
};

const Bookings = () => {
  const { user } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("myProperties");
  const [loading, setLoading] = useState(false);

  const fetchTab = useCallback(
    async (tabType, backType) => {
      if (!user?.[tabType]?.length) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.post("/api/fetching/get-user-property", {
          Type: tabType,
          NestedPop: backType,
        });
        setItems(res.status === 200 ? res.data?.properties || [] : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    const meta = TAB_CONFIG.find((t) => t.value === activeTab) || TAB_CONFIG[0];
    fetchTab(meta.value, meta.backType);
  }, [activeTab, fetchTab]);

  const tabItems = TAB_CONFIG.map((t) => ({
    value: t.value,
    label: t.label,
    icon: t.icon,
    count: user?.[t.value]?.length || undefined,
  }));

  const emptyMeta = EMPTY_COPY[activeTab] || EMPTY_COPY.myProperties;
  const ActiveIcon =
    TAB_CONFIG.find((t) => t.value === activeTab)?.icon || Building2;

  return (
    <div className="flex flex-col gap-6 py-5 sm:py-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Portfolio &amp; Activity
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My Space
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your published listings, reservations, site visits, and bookmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/visits">
              <CalendarCheck className="size-4 text-brand" aria-hidden="true" />
              <span>Site Visits</span>
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link to="/add-property">
              <Plus className="size-4" aria-hidden="true" />
              <span>List property</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={tabItems}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ActiveIcon}
          title={emptyMeta.title}
          description={emptyMeta.description}
          action={
            <Button asChild variant="brand" size="sm">
              <Link to={emptyMeta.cta.to}>{emptyMeta.cta.label}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const prop = item?.propId;
            if (!prop?._id) {
              return (
                <div
                  key={item?._id || index}
                  className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center"
                >
                  <Building2 className="mb-2 size-7 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    Listing unavailable
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This property was removed by the owner.
                  </p>
                </div>
              );
            }

            if (activeTab === "bookedProperties") {
              const isVisit = item.bType === "visit";
              const targetUrl = isVisit && item._id
                ? `/visits/${item._id}`
                : `/booked/${prop._id}`;

              return (
                <div key={item._id || prop._id} className="flex flex-col gap-2">
                  <Properties prop={prop} linkTo={targetUrl} className="flex-1" />
                  <Link
                    to={targetUrl}
                    className="flex items-center justify-between rounded-2xl border border-border/80 bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      {isVisit ? (
                        <>
                          <CalendarCheck className="size-4 text-brand" aria-hidden="true" />
                          <VisitStatusPill status={item.visitStatus || "requested"} short />
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-4 text-brand" aria-hidden="true" />
                          <Badge variant={item.status ? "success" : "warning"}>
                            {item.status ? "Booking Confirmed" : "Awaiting Owner"}
                          </Badge>
                        </>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-brand">
                      <span>{isVisit ? "Open visit" : "Manage"}</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              );
            }

            const linkTo =
              activeTab === "myProperties" ? `/my/${prop._id}` : `/view/${prop._id}`;

            return <Properties key={prop._id || index} prop={prop} linkTo={linkTo} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;
