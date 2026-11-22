import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Settings, Plus, Building2 } from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import Properties, { PropertyCardSkeleton } from "../../components/Properties";
import api from "../../api/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";

const TABS = [
  { value: "myProperties", backType: null, label: "Listings" },
  { value: "saved", backType: null, label: "Saved" },
  { value: "bookedProperties", backType: "propId", label: "Bookings" },
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
    const meta = TABS.find((t) => t.value === activeType) || TABS[0];
    loadTab(meta.value, meta.backType);
  }, [activeType, loadTab]);

  return (
    <div className="flex flex-col gap-7 py-5 sm:py-7">
      {/* Minimal Profile Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar src={user?.pp} name={user?.username || "User"} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {user?.username || "Account"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || user?.phone || ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/edit-profile"
            aria-label="Edit profile"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <Edit3 className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/settings"
            aria-label="Settings"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
          >
            <Settings className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3">
        <Tabs
          value={activeType}
          onValueChange={setActiveType}
          items={TABS.map((t) => ({
            value: t.value,
            label: t.label,
            count: user?.[t.value]?.length || undefined,
          }))}
        />

        {activeType === "myProperties" ? (
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/add-property">
              <Plus className="size-3.5" aria-hidden="true" />
              <span>New</span>
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : list.filter((x) => x?.propId?._id).length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            activeType === "myProperties"
              ? "No listings yet"
              : activeType === "saved"
                ? "Nothing saved yet"
                : "No bookings yet"
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {list
            .filter((item) => item?.propId?._id)
            .map((item) => {
              const prop = item.propId;
              const linkTo =
                activeType === "myProperties"
                  ? `/my/${prop._id}`
                  : activeType === "bookedProperties"
                    ? item.bType === "visit" && item._id
                      ? `/visits/${item._id}`
                      : `/booked/${prop._id}`
                    : `/view/${prop._id}`;
              return (
                <Properties
                  key={item._id || prop._id}
                  prop={prop}
                  linkTo={linkTo}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Profile;
