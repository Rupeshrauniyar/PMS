import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  Edit3,
  Building2,
  Bookmark,
  CalendarCheck,
  Settings,
  Plus,
  CreditCard,
  ArrowRight,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import Properties, { PropertyCardSkeleton } from "../../components/Properties";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill } from "@/components/ui/visit-status";

const PROFILE_TABS = [
  { value: "myProperties", backType: null, label: "My Listings", icon: Building2 },
  { value: "bookedProperties", backType: "propId", label: "Bookings", icon: CalendarCheck },
  { value: "saved", backType: null, label: "Saved", icon: Bookmark },
];

const Profile = () => {
  const { user } = useContext(AppContext);
  const [activeType, setActiveType] = useState("myProperties");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTab = useCallback(
    async (type, backType) => {
      if (!user?.[type]?.length) {
        setList([]);
        return;
      }
      try {
        setLoading(true);
        const res = await api.post("/api/fetching/get-user-property", {
          Type: type,
          NestedPop: backType,
        });
        setList(res.status === 200 ? res.data?.properties || [] : []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    const meta =
      PROFILE_TABS.find((t) => t.value === activeType) || PROFILE_TABS[0];
    loadTab(meta.value, meta.backType);
  }, [activeType, loadTab]);

  const tabItems = PROFILE_TABS.map((t) => ({
    value: t.value,
    label: t.label,
    icon: t.icon,
    count: user?.[t.value]?.length || undefined,
  }));

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Recently joined";

  return (
    <div className="flex flex-col gap-6 py-5 sm:py-8">
      {/* Hero Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.pp}
                name={user?.username || "User"}
                size="xl"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">
                    {user?.username || "Propatyc Member"}
                  </h1>
                  {user?.phone ? (
                    <Badge variant="success">Phone verified</Badge>
                  ) : (
                    <Badge variant="warning">Add phone</Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {user?.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5 text-brand" aria-hidden="true" />
                      <span>{user.email}</span>
                    </span>
                  ) : null}
                  {user?.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-brand" aria-hidden="true" />
                      <span>{user.phone}</span>
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-brand" aria-hidden="true" />
                    <span>Joined {memberSince}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/edit-profile">
                  <Edit3 className="size-3.5" aria-hidden="true" />
                  <span>Edit profile</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/settings">
                  <Settings className="size-3.5" aria-hidden="true" />
                  <span>Settings</span>
                </Link>
              </Button>
              <Button asChild variant="brand" size="sm">
                <Link to="/add-property">
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>List property</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-5">
            {[
              { label: "Listings", count: user?.myProperties?.length ?? 0, to: null },
              { label: "Bookings", count: user?.bookedProperties?.length ?? 0, to: null },
              { label: "Saved", count: user?.saved?.length ?? 0, to: null },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl border border-border/60 bg-muted/35 py-3.5 text-center"
              >
                <span className="text-xl font-extrabold text-foreground tabular-nums">
                  {s.count}
                </span>
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Site Visits Shortcut */}
          <Link
            to="/visits"
            className="flex items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand-soft/45 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-brand-soft/75"
          >
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="size-5 text-brand" aria-hidden="true" />
              <div>
                <p className="font-bold">3-Party Site Visits</p>
                <p className="text-xs font-normal text-muted-foreground">
                  View your requested visits and incoming visit approvals
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-brand shrink-0" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div>
        <Tabs
          value={activeType}
          onValueChange={setActiveType}
          items={tabItems}
        />
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            activeType === "myProperties"
              ? "No properties listed yet"
              : activeType === "bookedProperties"
                ? "No bookings yet"
                : "No saved properties yet"
          }
          description={
            activeType === "myProperties"
              ? "Share photos and a walkthrough video to rent or sell your property."
              : activeType === "bookedProperties"
                ? "Properties you reserve or request visits for will show up here."
                : "Bookmark listings while browsing to compare them anytime."
          }
          action={
            <Button asChild variant="brand" size="sm">
              <Link to={activeType === "myProperties" ? "/add-property" : "/search"}>
                {activeType === "myProperties" ? "List a property" : "Explore listings"}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item, idx) => {
            const prop = item?.propId;
            if (!prop?._id) return null;

            if (activeType === "bookedProperties") {
              const isVisit = item.bType === "visit";
              const target =
                isVisit && item._id
                  ? `/visits/${item._id}`
                  : `/booked/${prop._id}`;
              return (
                <div key={item._id || prop._id} className="flex flex-col gap-2">
                  <Properties prop={prop} linkTo={target} className="flex-1" />
                  <Link
                    to={target}
                    className="flex items-center justify-between rounded-2xl border border-border/80 bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
                  >
                    {isVisit ? (
                      <VisitStatusPill status={item.visitStatus || "requested"} short />
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="size-3.5 text-brand" aria-hidden="true" />
                        <span>{item.status ? "Confirmed" : "Pending"}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-brand">
                      <span>{isVisit ? "Visit details" : "Booking"}</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              );
            }

            const linkTo =
              activeType === "myProperties" ? `/my/${prop._id}` : `/view/${prop._id}`;
            return <Properties key={prop._id || idx} prop={prop} linkTo={linkTo} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Profile;
