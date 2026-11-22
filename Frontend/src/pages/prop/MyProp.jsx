import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Edit3,
  Trash2,
  ExternalLink,
  Share2,
  Eye,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Film,
  Images,
  Building2,
  ArrowRight,
  Clock,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import { approveVisit, listMyVisits, rejectVisit } from "../../api/visits";
import PropertyShareSheet from "../../components/PropertyShareSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Textarea, Field } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { VisitStatusPill } from "@/components/ui/visit-status";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { formatVisitDate, formatVisitTimeRange } from "@/lib/visit";

const MyProp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setUser, refreshUser } = useContext(AppContext);
  const { toast } = useToast();

  const [property, setProperty] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Visit approve / reject state
  const [busyVisitId, setBusyVisitId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  // Pay booking confirm / reject state
  const [busyBookingId, setBusyBookingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const [propRes, visitsRes] = await Promise.allSettled([
        api.post("/api/fetching/get-my-prop", { _id: id }),
        listMyVisits({ role: "owner", status: "all" }),
      ]);

      if (propRes.status === "fulfilled" && propRes.value?.data?.Property?._id) {
        setProperty(propRes.value.data.Property);
      } else {
        const status = propRes.reason?.response?.status;
        if (status === 403 || status === 401) setForbidden(true);
        setProperty(null);
      }

      if (visitsRes.status === "fulfilled") {
        const allOwnerVisits = visitsRes.value?.visits || [];
        setVisits(
          allOwnerVisits.filter(
            (v) => String(v?.property?._id || v?.propId) === String(id),
          ),
        );
      } else {
        setVisits([]);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    try {
      const res = await api.post("/api/property/delete-property", {
        _id: id,
        propertyType: property?.propertyType,
      });
      if (res.status === 200) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            myProperties: (prev.myProperties || []).filter(
              (m) => String(m?.propId) !== String(id),
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
          title: "Property deleted",
          description: "Your listing and any open requests were cancelled.",
          variant: "success",
        });
        navigate("/profile");
      }
    } catch (err) {
      toast({
        title: "Could not delete listing",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
      throw err;
    }
  };

  const handleApproveVisit = async (visitId) => {
    try {
      setBusyVisitId(visitId);
      const data = await approveVisit(visitId);
      if (data?.visit) {
        setVisits((prev) =>
          prev.map((v) => (v._id === visitId ? data.visit : v)),
        );
      } else {
        await loadData();
      }
      toast({
        title: "Visit approved!",
        description:
          "Sent to the Propatyc broker pool. A broker will claim & schedule the meet.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not approve visit",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setBusyVisitId(null);
    }
  };

  const handleConfirmRejectVisit = async () => {
    if (!rejectTarget) return;
    try {
      const data = await rejectVisit(rejectTarget._id, {
        note: rejectNote.trim(),
      });
      if (data?.visit) {
        setVisits((prev) =>
          prev.map((v) => (v._id === rejectTarget._id ? data.visit : v)),
        );
      } else {
        await loadData();
      }
      setRejectNote("");
      setRejectTarget(null);
      toast({
        title: "Visit request declined",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Could not decline visit",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
      throw err;
    }
  };

  const handlePayBookingAction = async (booking, action) => {
    try {
      setBusyBookingId(booking._id);
      const endpoint =
        action === "confirm"
          ? "/api/booking/confirm-booking"
          : "/api/booking/reject-booking";
      const res = await api.post(endpoint, {
        _id: booking._id,
        userId: booking.userId?._id || booking.userId,
      });
      if (res.status === 200) {
        toast({
          title:
            action === "confirm"
              ? "Booking confirmed"
              : "Booking declined",
          variant: "success",
        });
        await loadData();
      }
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setBusyBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!property?._id) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title={forbidden ? "Not your listing" : "Property not found"}
          description={
            forbidden
              ? "This listing belongs to another account. You can view its public page instead."
              : "This listing may have been removed."
          }
          action={
            <Button asChild variant="brand">
              <Link to={forbidden ? `/view/${id}` : "/"}>
                {forbidden ? "Open public listing" : "Back to Explore"}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isRent = property.sellingType === "Rent System";
  const payBookings = (property.bookers || []).filter(
    (b) => b?.bType === "pay",
  );
  const requestedVisits = visits.filter((v) => v.visitStatus === "requested");

  return (
    <div className="flex flex-col gap-7 py-5 sm:py-8">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Owner Dashboard</Badge>
            <Badge variant="secondary">{property.propertyType}</Badge>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {property.title}
          </h1>
          {property.location ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-brand" aria-hidden="true" />
              <span>{property.location}</span>
            </p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="brand" size="sm">
            <Link to={`/edit-property/${property._id}`}>
              <Edit3 className="size-4" aria-hidden="true" />
              <span>Edit listing</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/view/${property._id}`}>
              <ExternalLink className="size-4" aria-hidden="true" />
              <span>Public page</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span>Share</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Overview Card + Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {isRent ? "Monthly Rent" : "Asking Price"}
            </span>
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {formatPrice(property.price)}
            </span>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Eye className="size-3.5 text-brand" aria-hidden="true" />
              <span>Total Views</span>
            </span>
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {(property.views ?? 0).toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarCheck className="size-3.5 text-brand" aria-hidden="true" />
              <span>Site Visits</span>
            </span>
            <span className="text-xl font-extrabold text-foreground tabular-nums">
              {visits.length}
              {requestedVisits.length > 0 ? (
                <span className="ml-2 text-xs font-bold text-warning">
                  ({requestedVisits.length} waiting)
                </span>
              ) : null}
            </span>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Images className="size-3.5 text-brand" aria-hidden="true" />
              <span>Media</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-foreground tabular-nums">
                {property.images?.length ?? 0} photos
              </span>
              {property.video?.url ? (
                <Badge variant="brand" className="gap-1">
                  <Film className="size-3" aria-hidden="true" />
                  <span>Video</span>
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visit Requests & Scheduled Meets */}
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarCheck className="size-5 text-brand" aria-hidden="true" />
                <span>Visit Requests &amp; Scheduled Meets</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Approve incoming requests to send them to Propatyc brokers for scheduling.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/visits">
                <span>All visits</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {visits.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No visit requests yet"
              description="When buyers request an in-person site visit, you can approve or decline them right here."
            />
          ) : (
            visits.map((v) => {
              const isRequested = v.visitStatus === "requested";
              const isScheduled = v.visitStatus === "scheduled";
              const isBusy = busyVisitId === v._id;

              return (
                <div
                  key={v._id}
                  className="flex flex-col gap-3.5 rounded-2xl border border-border/80 bg-muted/25 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={v.buyer?.pp}
                        name={v.buyer?.username || "Buyer"}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {v.buyer?.username || "Interested Buyer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatVisitDate(v.createdAt, { withWeekday: false })}
                        </p>
                      </div>
                    </div>
                    <VisitStatusPill status={v.visitStatus} />
                  </div>

                  {/* Scheduled Meet Banner */}
                  {isScheduled && v.schedule?.startAt ? (
                    <div className="flex flex-col gap-1 rounded-xl border border-success/30 bg-success-soft/50 p-3 text-xs">
                      <p className="font-bold text-foreground">
                        Confirmed Meet: {formatVisitDate(v.schedule.startAt)}
                      </p>
                      <p className="text-muted-foreground">
                        {formatVisitTimeRange(
                          v.schedule.startAt,
                          v.schedule.durationMin,
                        )}
                        {v.schedule.meetingPoint
                          ? ` · Meet at ${v.schedule.meetingPoint}`
                          : ""}
                      </p>
                    </div>
                  ) : Array.isArray(v.preferredSlots) && v.preferredSlots.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Buyer&apos;s preferred slots
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {v.preferredSlots.map((slot, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            <Clock className="size-3 text-brand" aria-hidden="true" />
                            <span>{formatVisitDate(slot)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {v.note ? (
                    <p className="selectable rounded-xl bg-card px-3 py-2 text-xs text-muted-foreground border border-border/60">
                      &ldquo;{v.note}&rdquo;
                    </p>
                  ) : null}

                  {/* Assigned Broker Contact */}
                  {v.broker ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={v.broker.pp}
                          name={v.broker.username || "Broker"}
                          size="xs"
                        />
                        <div>
                          <span className="text-[11px] text-muted-foreground">
                            Assigned Broker:{" "}
                          </span>
                          <span className="font-semibold text-foreground">
                            {v.broker.username}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.broker.phone ? (
                          <a
                            href={`tel:${v.broker.phone}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 font-semibold text-foreground hover:bg-accent"
                          >
                            <Phone className="size-3" aria-hidden="true" />
                            <span>{v.broker.phone}</span>
                          </a>
                        ) : null}
                        {v.broker.email ? (
                          <a
                            href={`mailto:${v.broker.email}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 font-semibold text-foreground hover:bg-accent"
                          >
                            <Mail className="size-3" aria-hidden="true" />
                            <span>Email</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/visits/${v._id}`}>
                        <span>View full details</span>
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>

                    {isRequested ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectNote("");
                            setRejectTarget(v);
                          }}
                        >
                          <XCircle className="size-4 text-destructive" aria-hidden="true" />
                          <span>Decline</span>
                        </Button>
                        <Button
                          variant="brand"
                          size="sm"
                          loading={isBusy}
                          onClick={() => handleApproveVisit(v._id)}
                        >
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          <span>Approve</span>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Direct / Payment Reservations (bType === "pay") */}
      {payBookings.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5 text-brand" aria-hidden="true" />
              <span>Payment Reservations ({payBookings.length})</span>
            </CardTitle>
            <CardDescription>
              Direct booking offers submitted by buyers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {payBookings.map((b) => {
              const confirmed = Boolean(b.status);
              const busy = busyBookingId === b._id;
              return (
                <div
                  key={b._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/25 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {b.userId?.username || "Buyer"}
                      </p>
                      <Badge variant={confirmed ? "success" : "warning"}>
                        {confirmed ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-brand tabular-nums">
                      Offered: {formatPrice(b.price)}
                    </p>
                    {b.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        &ldquo;{b.note}&rdquo;
                      </p>
                    ) : null}
                  </div>

                  {!confirmed ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => handlePayBookingAction(b, "reject")}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="brand"
                        size="sm"
                        loading={busy}
                        onClick={() => handlePayBookingAction(b, "confirm")}
                      >
                        Confirm Booking
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Share Sheet */}
      <PropertyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={property._id}
        propertyTitle={property.title}
      />

      {/* Delete Property ConfirmDialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this listing?"
        description="This permanently removes the property and cancels any open bookings or site visits."
        confirmLabel="Yes, delete listing"
        cancelLabel="Keep listing"
        destructive
        onConfirm={handleDelete}
      />

      {/* Decline Visit ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title="Decline site visit request?"
        description="The buyer will be notified that this visit request was declined."
        confirmLabel="Decline request"
        cancelLabel="Keep request"
        destructive
        onConfirm={handleConfirmRejectVisit}
      >
        <Field label="Reason or note for the buyer (optional)">
          <Textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g., Property is already under offer…"
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
};

export default MyProp;
