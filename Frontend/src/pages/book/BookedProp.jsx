import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  Banknote,
  ExternalLink,
  Building2,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import ExtendedProperty from "../../components/ExtendedProperty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill } from "@/components/ui/visit-status";
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

  const handleCancelBooking = async () => {
    if (!activeBooking?._id) return;
    try {
      const res = await api.post("/api/booking/cancel-booking", {
        _id: activeBooking._id,
      });
      if (res.status === 200) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            bookedProperties: (prev.bookedProperties || []).filter(
              (item) => String(item?.propId) !== String(id),
            ),
          };
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
          return updated;
        });
        refreshUser?.();
        toast({
          title: "Booking cancelled",
          description: "Your reservation has been cancelled.",
          variant: "success",
        });
        navigate("/bookings");
      }
    } catch (err) {
      toast({
        title: "Could not cancel booking",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5 py-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title="No active booking found"
          description="You don't have an active reservation for this property."
          action={
            <Button asChild variant="brand">
              <Link to={`/view/${id}`}>View property listing</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isVisit = activeBooking.bType === "visit";
  const isConfirmed = Boolean(activeBooking.status);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="-ml-2 mb-1 gap-1.5"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Reservation Details
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCancelOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          <Ban className="size-4" aria-hidden="true" />
          <span>Cancel booking</span>
        </Button>
      </div>

      {/* Visit Redirect Banner if this booking is a visit */}
      {isVisit ? (
        <Card className="border-brand/40 bg-brand-soft/45">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CalendarCheck className="size-6 text-brand shrink-0" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">
                    Site Visit Coordination
                  </p>
                  <VisitStatusPill status={activeBooking.visitStatus || "requested"} short />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  View broker contact, preferred slots, and calendar invite on the dedicated visit page.
                </p>
              </div>
            </div>
            <Button asChild variant="brand" size="sm">
              <Link to={`/visits/${activeBooking._id}`}>
                <span>Open visit status</span>
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Payment Reservation Banner */
        <Card
          className={
            isConfirmed
              ? "border-success/40 bg-success-soft/40"
              : "border-warning/40 bg-warning-soft/40"
          }
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isConfirmed ? (
                <CheckCircle2 className="size-6 text-success shrink-0" aria-hidden="true" />
              ) : (
                <Clock className="size-6 text-warning shrink-0" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-bold text-foreground">
                  {isConfirmed ? "Booking Confirmed by Owner" : "Awaiting Owner Confirmation"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isConfirmed
                    ? "Complete your payment via eSewa to finalize this reservation."
                    : "The property owner is reviewing your booking offer."}
                </p>
              </div>
            </div>

            {isConfirmed ? (
              <Button asChild variant="brand">
                <Link to={`/pay/${activeBooking._id}/${activeBooking.price || property?.price}`}>
                  <CreditCard className="size-4" aria-hidden="true" />
                  <span>Pay via eSewa</span>
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {isVisit ? "Site Visit" : "Direct Reservation"}
            </Badge>
            <Badge variant={isConfirmed ? "success" : "warning"}>
              {isConfirmed ? "Confirmed" : "Pending"}
            </Badge>
          </div>

          {activeBooking.price ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 p-3.5">
              <Banknote className="size-5 text-brand shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Offered / Agreed Price</p>
                <p className="text-base font-extrabold text-foreground tabular-nums">
                  {formatPrice(activeBooking.price)}
                </p>
              </div>
            </div>
          ) : null}

          {activeBooking.note ? (
            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/35 p-3.5">
              <FileText className="mt-0.5 size-4 text-brand shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Your Note</p>
                <p className="selectable mt-0.5 text-sm text-foreground">
                  {activeBooking.note}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Property Overview */}
      {property?._id ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Property Overview</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/view/${property._id}`}>
                <span>Public page</span>
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ExtendedProperty props={property} price={activeBooking.price || null} />
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this reservation?"
        description="This action cannot be undone. The property owner will be notified."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep reservation"
        destructive
        onConfirm={handleCancelBooking}
      />
    </div>
  );
};

export default BookedProp;
