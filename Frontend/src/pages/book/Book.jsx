import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Building2,
} from "lucide-react";

import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import EditProfile from "../auth/EditProfile";
import Signin from "../auth/Signin";
import Signup from "../auth/Signup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function minDateTimeLocal() {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Book = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user, setUser, refreshUser } = useContext(AppContext);
  const { toast } = useToast();

  const [authTab, setAuthTab] = useState("signin");
  const [bookingType, setBookingType] = useState("pay");
  const [slotDate, setSlotDate] = useState("");
  const [offerPrice, setOfferPrice] = useState(() => String(params.price || ""));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.price && !offerPrice) {
      setOfferPrice(String(params.price));
    }
  }, [params.price, offerPrice]);

  if (!params.id) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title="No property selected"
          description="Go back and open a property listing to reserve it."
          action={
            <Button asChild variant="brand">
              <Link to="/">Browse properties</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOwner = Boolean(
    user?.myProperties?.some((p) => String(p?.propId) === String(params.id)),
  );
  const existingBooking = user?.bookedProperties?.find(
    (p) => String(p?.propId) === String(params.id),
  );

  if (isOwner) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title="This is your own listing"
          description="Manage incoming visit requests and bookings from your owner dashboard."
          action={
            <Button asChild variant="brand">
              <Link to={`/my/${params.id}`}>Open Owner Dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (existingBooking) {
    const dest =
      existingBooking.bType === "visit" && existingBooking._id
        ? `/visits/${existingBooking._id}`
        : `/booked/${params.id}`;
    return (
      <div className="py-12">
        <EmptyState
          icon={CheckCircle2}
          title="Already requested"
          description="You already have an active request for this property."
          action={
            <Button asChild variant="brand">
              <Link to={dest}>View status</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isNegotiated =
    offerPrice && String(offerPrice).trim() !== String(params.price).trim();

  const validate = () => {
    const e = {};
    if (!user?._id) {
      e.auth = "Please sign in first.";
    } else if (!user?.phone || user.phone.replace(/\D/g, "").length < 7) {
      e.contact = "Please save your phone number above so the owner/broker can reach you.";
    }

    const numericPrice = Number(String(offerPrice).replace(/,/g, ""));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      e.price = "Enter a valid offer price.";
    }

    if (bookingType === "visit") {
      if (!slotDate) {
        e.date = "Choose a preferred date and time.";
      } else if (new Date(slotDate).getTime() <= Date.now()) {
        e.date = "Preferred visit time must be in the future.";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const cleanPrice = String(offerPrice).replace(/,/g, "").trim();
      const isoSlot =
        bookingType === "visit" && slotDate
          ? new Date(slotDate).toISOString()
          : undefined;

      const res = await api.post("/api/booking/book", {
        propId: params.id,
        price: cleanPrice,
        userId: user._id,
        date: isoSlot || slotDate,
        preferredSlots: isoSlot ? [isoSlot] : undefined,
        note: note.trim(),
        bType: bookingType,
      });

      if (res.status === 200 || res.status === 201) {
        const createdBooking = res.data?.booking || res.data?.visit;
        if (createdBooking) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              bookedProperties: [...(prev.bookedProperties || []), createdBooking],
            };
            try {
              localStorage.setItem("user", JSON.stringify(updated));
            } catch {
              /* ignore */
            }
            return updated;
          });
        }
        refreshUser?.();

        toast({
          title:
            bookingType === "visit"
              ? "Site visit requested!"
              : "Reservation submitted!",
          description:
            res.data?.message || "The property owner has been notified.",
          variant: "success",
        });

        const visitId = res.data?.visit?._id || (bookingType === "visit" && createdBooking?._id);
        if (visitId) {
          navigate(`/visits/${visitId}`);
        } else {
          navigate(`/booked/${params.id}`);
        }
      }
    } catch (err) {
      toast({
        title: "Could not submit booking",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-5 pb-28 sm:py-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 mb-1 gap-1.5"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Back to listing</span>
        </Button>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Reserve Property
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Complete your reservation
        </h1>
      </div>

      {/* Step 1: Account & Verified Phone */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>1. Your Contact Details</CardTitle>
            {user?.phone ? (
              <Badge variant="success">Ready</Badge>
            ) : (
              <Badge variant="warning">Phone required</Badge>
            )}
          </div>
          <CardDescription>
            {user
              ? "Confirm your contact number so the host or assigned broker can reach you."
              : "Sign in or create an account to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <EditProfile error={errors.contact || null} css />
          ) : (
            <div className="flex flex-col gap-4">
              <Tabs
                fullWidth
                value={authTab}
                onValueChange={setAuthTab}
                items={[
                  { value: "signin", label: "Sign In" },
                  { value: "signup", label: "Create Account" },
                ]}
              />
              {authTab === "signin" ? (
                <Signin from={location.pathname} css />
              ) : (
                <Signup from={location.pathname} css />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Reservation Preferences */}
      <Card className={cn(!user && "opacity-60 pointer-events-none")}>
        <CardHeader>
          <CardTitle>2. Booking Type &amp; Offer</CardTitle>
          <CardDescription>
            Reserve directly with a price offer or schedule an in-person visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="book-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "pay",
                  label: "Reserve / Pay",
                  desc: "Direct offer & eSewa",
                  icon: CreditCard,
                },
                {
                  value: "visit",
                  label: "Site Visit",
                  desc: "3-party guided tour",
                  icon: CalendarCheck,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = bookingType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBookingType(opt.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all",
                      active
                        ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                        : "border-border bg-card hover:border-foreground/25",
                    )}
                  >
                    <Icon
                      className={cn("size-4", active ? "text-brand" : "text-muted-foreground")}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold text-foreground">
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {bookingType === "visit" ? (
              <Field
                label="Preferred date & time"
                required
                error={errors.date}
              >
                <Input
                  type="datetime-local"
                  value={slotDate}
                  min={minDateTimeLocal()}
                  onChange={(e) => {
                    setSlotDate(e.target.value);
                    setErrors((p) => ({ ...p, date: "" }));
                  }}
                />
              </Field>
            ) : null}

            <Field
              label="Offer Price (Rs.)"
              error={errors.price}
              hint={
                isNegotiated
                  ? `Negotiated offer · Listed price is ${formatPrice(params.price)}`
                  : "You may propose a negotiated price if needed."
              }
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={offerPrice}
                onChange={(e) => {
                  setOfferPrice(e.target.value);
                  setErrors((p) => ({ ...p, price: "" }));
                }}
              />
            </Field>

            <Field label="Note for owner (optional)">
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Move-in timeline, lease duration, or questions…"
              />
            </Field>
          </form>
        </CardContent>
      </Card>

      {/* Sticky Bottom Confirm Bar */}
      <div className="chrome-fixed-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-border/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isNegotiated ? "Your offer" : "Listed price"}
            </p>
            <p className="truncate text-lg font-extrabold text-foreground tabular-nums">
              {formatPrice(offerPrice || params.price)}
            </p>
          </div>

          <Button
            type="submit"
            form="book-form"
            variant="brand"
            loading={submitting}
            disabled={!user?._id}
            className="px-6"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <span>
              {!user?._id
                ? "Sign in above"
                : bookingType === "visit"
                  ? "Request Visit"
                  : "Confirm Reservation"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Book;
