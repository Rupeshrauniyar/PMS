import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Building2 } from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { MediaGallery } from "@/components/ui/media-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";

const BookedProp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, refreshUser } = useContext(AppContext);
  const { toast } = useToast();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.post("/api/fetching/get-property", { _id: id });
        if (!cancelled) {
          setProperty(res?.data?.Property?._id ? res.data.Property : null);
        }
      } catch {
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const activeBooking =
    property?.viewer?.myBooking ||
    user?.bookedProperties?.find((p) => String(p?.propId) === String(id)) ||
    null;

  // Redirect visit bookings directly to the clean Visit Detail page
  useEffect(() => {
    if (!loading && activeBooking?.bType === "visit" && activeBooking?._id) {
      navigate(`/visits/${activeBooking._id}`, { replace: true });
    }
  }, [loading, activeBooking, navigate]);

  // Auto-reconcile pending gateway payment if buyer completed checkout on eSewa/Khalti
  useEffect(() => {
    if (
      loading ||
      !activeBooking?._id ||
      activeBooking?.bType === "visit" ||
      activeBooking?.paymentStatus === "paid"
    ) {
      return undefined;
    }
    let cancelled = false;
    api
      .get(`/api/payment/booking/${activeBooking._id}`)
      .then((res) => {
        const b = res.data?.booking;
        if (!cancelled && b?.paymentStatus === "paid") {
          setProperty((prev) =>
            prev
              ? {
                  ...prev,
                  viewer: {
                    ...(prev.viewer || {}),
                    myBooking: { ...(prev.viewer?.myBooking || {}), ...b },
                  },
                }
              : prev,
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, activeBooking?._id, activeBooking?.bType, activeBooking?.paymentStatus]);

  const handleCancel = async () => {
    if (!activeBooking?._id) return;
    const res = await api.post("/api/booking/cancel-booking", {
      _id: activeBooking._id,
    });
    if (res.status === 200) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              bookedProperties: (prev.bookedProperties || []).filter(
                (item) => String(item?.propId) !== String(id),
              ),
            }
          : prev,
      );
      refreshUser?.();
      toast({ title: "Booking cancelled" });
      navigate("/profile");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 py-6">
        <Skeleton className="aspect-[16/9] rounded-3xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!activeBooking || !property?._id) {
    return (
      <EmptyState
        icon={Building2}
        title="No active reservation"
        action={
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to={`/view/${id}`}>View listing</Link>
          </Button>
        }
      />
    );
  }

  const isConfirmed = Boolean(activeBooking.status);
  const isPaid = activeBooking.paymentStatus === "paid";
  const isPayAtProperty = activeBooking.paymentStatus === "pay_at_property";
  const bookingPrice = activeBooking.price || property.price;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4 pb-16 sm:py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <Badge variant={isPaid ? "success" : isConfirmed ? "default" : "secondary"}>
          {isPaid
            ? "Paid"
            : isPayAtProperty
              ? "Pay at property"
              : isConfirmed
                ? "Confirmed by owner"
                : "Awaiting owner"}
        </Badge>
      </div>

      {/* Media + Property Title */}
      <MediaGallery
        images={property.images || []}
        video={property.video}
        title={property.title}
      />

      <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">
            {property.title}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {property.location}
          </p>
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">
          {formatPrice(bookingPrice)}
        </span>
      </div>

      {/* Payment Status / Action */}
      {isPaid ? (
        <div className="flex items-center justify-between rounded-2xl border border-border p-4 text-sm">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            <span>
              Paid via{" "}
              {activeBooking.paymentGateway === "khalti" ? "Khalti" : "eSewa"}
            </span>
          </span>
          {activeBooking.paymentRef ? (
            <span className="font-mono text-xs text-muted-foreground">
              Ref: {activeBooking.paymentRef}
            </span>
          ) : null}
        </div>
      ) : isPayAtProperty ? (
        <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Selected to pay {formatPrice(bookingPrice)} directly at the property.
        </div>
      ) : isConfirmed ? (
        <Button asChild size="lg" className="w-full rounded-full">
          <Link to={`/pay/${activeBooking._id}/${bookingPrice}`}>
            Pay {formatPrice(bookingPrice)}
          </Link>
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Payment unlocks once the owner confirms your reservation.
        </p>
      )}

      {!isPaid ? (
        <Button
          variant="outline"
          onClick={() => setCancelOpen(true)}
          className="w-full rounded-full text-destructive hover:text-destructive"
        >
          Cancel reservation
        </Button>
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this reservation?"
        confirmLabel="Cancel reservation"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
};

export default BookedProp;
