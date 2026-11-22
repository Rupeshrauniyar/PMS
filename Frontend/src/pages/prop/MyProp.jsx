import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  Building2,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { approveVisit, listMyVisits, rejectVisit } from "../../api/visits";
import { MediaGallery } from "@/components/ui/media-gallery";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { formatVisitDate } from "@/lib/visit";

const MyProp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setUser, refreshUser } = useContext(AppContext);
  const { toast } = useToast();

  const [property, setProperty] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, visitsRes] = await Promise.allSettled([
        api.post("/api/fetching/get-my-prop", { _id: id }),
        listMyVisits({ role: "owner", status: "all" }),
      ]);

      setProperty(
        propRes.status === "fulfilled" && propRes.value?.data?.Property?._id
          ? propRes.value.data.Property
          : null,
      );

      if (visitsRes.status === "fulfilled") {
        setVisits(
          (visitsRes.value?.visits || []).filter(
            (v) => String(v?.property?._id || v?.propId) === String(id),
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    const res = await api.post("/api/property/delete-property", { _id: id });
    if (res.status === 200) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              myProperties: (prev.myProperties || []).filter(
                (m) => String(m?.propId) !== String(id),
              ),
            }
          : prev,
      );
      refreshUser?.();
      toast({ title: "Listing deleted" });
      navigate("/profile");
    }
  };

  const handleApprove = async (visitId) => {
    try {
      setBusyId(visitId);
      const data = await approveVisit(visitId);
      if (data?.visit) {
        setVisits((prev) => prev.map((v) => (v._id === visitId ? data.visit : v)));
      } else {
        await loadData();
      }
      toast({ title: "Visit approved", variant: "success" });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (visitId) => {
    try {
      setBusyId(visitId);
      const data = await rejectVisit(visitId, {});
      if (data?.visit) {
        setVisits((prev) => prev.map((v) => (v._id === visitId ? data.visit : v)));
      } else {
        await loadData();
      }
      toast({ title: "Visit declined" });
    } finally {
      setBusyId(null);
    }
  };

  const handlePayAction = async (bookingId, action) => {
    try {
      setBusyId(bookingId);
      await api.post(
        action === "confirm"
          ? "/api/booking/confirm-booking"
          : "/api/booking/reject-booking",
        { _id: bookingId },
      );
      await loadData();
      toast({ title: action === "confirm" ? "Booking confirmed" : "Booking declined" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5 py-6">
        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
        <Skeleton className="h-7 w-1/2" />
      </div>
    );
  }

  if (!property?._id) {
    return (
      <EmptyState
        icon={Building2}
        title="Listing not found"
        action={
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/profile">Back to profile</Link>
          </Button>
        }
      />
    );
  }

  const payBookings = (property.bookers || []).filter(
    (b) => b.bType === "pay" && b.active !== false,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7 py-4 pb-16 sm:py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/view/${property._id}`}>
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span>Public view</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/edit-property/${property._id}`}>
              <Edit3 className="size-3.5" aria-hidden="true" />
              <span>Edit</span>
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete listing"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-destructive hover:bg-danger-soft"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Media + Summary */}
      <div className="space-y-4">
        <MediaGallery
          images={property.images || []}
          video={property.video}
          title={property.title}
        />

        <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
              {property.title}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {property.location}
            </p>
          </div>
          <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">
            {formatPrice(property.price)}
          </span>
        </div>
      </div>

      {/* Site Visit Requests */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground">
          Visit requests ({visits.length})
        </h2>

        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visit requests yet.</p>
        ) : (
          <div className="divide-y divide-border/70 rounded-2xl border border-border">
            {visits.map((v) => {
              const when = v.schedule?.startAt
                ? formatVisitDate(v.schedule.startAt)
                : v.preferredSlots?.[0]
                  ? formatVisitDate(v.preferredSlots[0], { withWeekday: false })
                  : "Flexible";

              return (
                <div
                  key={v._id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <Link to={`/visits/${v._id}`} className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {v.buyer?.username || "Buyer"}
                      </span>
                      <VisitStatusPill status={v.visitStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {when}
                      {v.broker?.username ? ` · Broker: ${v.broker.username}` : ""}
                    </p>
                  </Link>

                  {v.visitStatus === "requested" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        loading={busyId === v._id}
                        onClick={() => handleApprove(v._id)}
                        className="rounded-full px-4"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === v._id}
                        onClick={() => handleReject(v._id)}
                        className="rounded-full px-3.5"
                      >
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <Link to={`/visits/${v._id}`} className="text-muted-foreground">
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Direct Reservations (Pay Bookings) */}
      {payBookings.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Reservations</h2>
          <div className="divide-y divide-border/70 rounded-2xl border border-border">
            {payBookings.map((b) => (
              <div
                key={b._id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {b.userId?.username || "Buyer"} · {formatPrice(b.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.status ? "Confirmed" : "Pending confirmation"}
                  </p>
                </div>
                {!b.status ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={busyId === b._id}
                      onClick={() => handlePayAction(b._id, "confirm")}
                      className="rounded-full"
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === b._id}
                      onClick={() => handlePayAction(b._id, "reject")}
                      className="rounded-full"
                    >
                      Decline
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this listing?"
        description="This permanently removes your listing."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default MyProp;
