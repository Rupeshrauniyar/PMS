import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import api from "../../api/client";
import AlertBox from "../../components/AlertBox";
import ExtendedProperty from "../../components/ExtendedProperty";
import {
  Loader2,
  MoreVertical,
  ArrowUpRight,
  CalendarDays,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  MapPin,
  Banknote,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* ── Timeline step ── */
const TimelineStep = ({ number, label, sublabel, status }) => {
  const styles = {
    done: {
      dot: "bg-emerald-500 text-white shadow-emerald-200 shadow-md",
      connector: "bg-emerald-200",
      label: "text-zinc-900 font-semibold",
      sub: "text-zinc-500",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    active: {
      dot: "bg-amber-400 text-white shadow-amber-200 shadow-md",
      connector: "bg-zinc-100",
      label: "text-zinc-900 font-semibold",
      sub: "text-zinc-500",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    pending: {
      dot: "bg-zinc-100 text-zinc-400 border border-zinc-200",
      connector: "bg-zinc-100",
      label: "text-zinc-400 font-medium",
      sub: "text-zinc-300",
      icon: <Circle className="w-3.5 h-3.5" />,
    },
  };
  const s = styles[status] || styles.pending;

  return (
    <div className="flex items-start gap-4 relative z-10">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${s.dot}`}
        >
          {status === "done" ? s.icon : status === "active" ? s.icon : number}
        </div>
      </div>
      <div className="pb-7 flex-1">
        <p className={`text-sm ${s.label}`}>{label}</p>
        {sublabel && <p className={`text-xs mt-0.5 leading-relaxed ${s.sub}`}>{sublabel}</p>}
      </div>
    </div>
  );
};

/* ── Info chip ── */
const Chip = ({ icon: Icon, label, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${colors[color] || colors.zinc}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

const BookedProp = () => {
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [cancLoading, setCancLoading] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(true);

  /* ── Guard: not a booked property ── */
  if (!user?.bookedProperties?.find((p) => p.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-black mx-auto mb-6" />
        <h1 className="text-3xl font-light tracking-tight text-black mb-3">
          Not Your Booking
        </h1>
        <p className="text-sm text-zinc-500 max-w-xs mb-8 leading-relaxed">
          This booking doesn't exist in your account. View the property listing instead.
        </p>
        <Link
          to={`/view/${params.id}`}
          className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
        >
          View Property <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  useEffect(() => {
    const getProperty = async () => {
      try {
        const response = await api.post("/api/fetching/get-property", {
          _id: params.id,
        });
        if (response?.status === 200 && response.data.Property?._id) {
          setPropData(response.data.Property);
        } else {
          setPropData({});
        }
      } catch {
        setPropData({});
      } finally {
        setPropertyLoading(false);
      }
    };
    getProperty();
  }, [params.id]);

  useEffect(() => {
    document.body.style.overflow = cancelOpen ? "hidden" : "auto";
  }, [cancelOpen]);

  /* ── Skeleton ── */
  if (propertyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white pb-20 pt-28">
        <div className="max-w-2xl w-full px-4 animate-pulse space-y-5">
          <div className="bg-zinc-100 h-80 rounded-2xl w-full" />
          <div className="space-y-2 pt-2">
            <div className="h-7 bg-zinc-100 rounded-full w-2/3" />
            <div className="h-4 bg-zinc-100 rounded-full w-1/3" />
          </div>
          <div className="h-px bg-zinc-100 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-100 h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Property not found (after cancel) ── */
  if (!props._id) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-white">
        <p className="text-sm text-zinc-500">Property no longer available.</p>
        {success && (
          <AlertBox
            message={success}
            type="success"
            onClose={() => {
              setUser((prev) => ({
                ...prev,
                bookedProperties: prev.bookedProperties.filter(
                  (item) => item.propId !== params.id
                ),
              }));
              navigate("/profile");
            }}
          />
        )}
      </div>
    );
  }

  const HandleCancel = async () => {
    try {
      setCancLoading(true);
      const getBooking = user.bookedProperties.filter(
        (data) => data.propId === params?.id
      );
      const res = await api.post("/api/booking/cancel-booking", {
        _id: getBooking[0]._id,
      });
      if (res.status === 200) {
        setCancelOpen(false);
        setCancLoading(false);
        setSuccess("Your booking has been cancelled.");
        setPropData({});
      }
    } catch {
      setCancelOpen(false);
      setCancLoading(false);
      setBackendError("Unable to cancel booking.");
    }
  };

  const activeBooking = user?.bookedProperties?.find(
    (p) => p.propId === params.id
  );

  const isVisit = activeBooking?.bType === "visit";
  const isConfirmed = activeBooking?.status;

  return (
    <div className="w-full min-h-screen  overflow-hidden pt-20 pb-24">
      {/* ── Alerts ── */}
      {success && (
        <AlertBox
          message={success}
          type="success"
          onClose={() => {
            setSuccess(null);
            navigate("/profile");
          }}
        />
      )}
      {backendError && (
        <AlertBox
          message={backendError}
          type="error"
          onClose={() => setBackendError(null)}
        />
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" />
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 w-full max-w-sm p-6">
              {cancLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin w-5 h-5 text-zinc-400" />
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-500 text-lg font-bold">✕</span>
                  </div>
                  <h3 className="text-base font-semibold text-black text-center mb-1">
                    Cancel Booking?
                  </h3>
                  <p className="text-sm text-zinc-500 text-center mb-6 leading-relaxed">
                    This action cannot be undone. Your booking will be permanently cancelled.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCancelOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 active:scale-[0.98] transition-all"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={HandleCancel}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 active:scale-[0.98] transition-all"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="max-w-lg mx-auto px-2">

        {/* ── Top Bar ── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">
              My Booking
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-black">
              Booking Details
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm">
                <MoreVertical className="w-4 h-4 text-zinc-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-zinc-100">
              <DropdownMenuItem
                className="text-sm text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                onClick={() => setCancelOpen(true)}
              >
                Cancel Booking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Status Banner ── */}
        <div className={`rounded-2xl px-5 py-4 mb-4 flex items-center gap-4 border ${
          isConfirmed
            ? "bg-emerald-50 border-emerald-100"
            : "bg-amber-50 border-amber-100"
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isConfirmed ? "bg-emerald-100" : "bg-amber-100"
          }`}>
            {isConfirmed
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              : <Clock className="w-5 h-5 text-amber-600" />
            }
          </div>
          <div>
            <p className={`text-sm font-semibold ${isConfirmed ? "text-emerald-800" : "text-amber-800"}`}>
              {isConfirmed ? "Booking Confirmed" : "Awaiting Confirmation"}
            </p>
            <p className={`text-xs mt-0.5 ${isConfirmed ? "text-emerald-600" : "text-amber-600"}`}>
              {isConfirmed
                ? isVisit ? "Your visit has been scheduled." : "Proceed to complete payment."
                : "The host is reviewing your request."
              }
            </p>
          </div>
        </div>

        {/* ── Accordions ── */}
        <div className="flex flex-col gap-3">

          {/* Accordion 1 — Property Details */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setPropOpen((p) => !p)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-zinc-800 tracking-wide">
                  Property Details
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${propOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                propOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-zinc-100 px-5 pb-5 pt-4">
                <ExtendedProperty props={props} price={activeBooking?.price || null} />
              </div>
            </div>
          </div>

          {/* Accordion 2 — Booking Details */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setBookingOpen((p) => !p)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <span className="text-sm font-semibold text-zinc-800 tracking-wide">
                  Booking Details
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${bookingOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                bookingOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-zinc-100 px-5 pb-5 pt-4 flex flex-col gap-4">

                {/* Chips row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isVisit ? (
                    <Chip icon={CalendarDays} label="Schedule Visit" color="blue" />
                  ) : (
                    <Chip icon={CreditCard} label="Pay Now" color="violet" />
                  )}
                  {isConfirmed ? (
                    <Chip icon={CheckCircle2} label="Confirmed" color="emerald" />
                  ) : (
                    <Chip icon={Clock} label="Pending" color="amber" />
                  )}
                </div>

                {/* Price */}
                {activeBooking?.price && (
                  <div className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400">
                        Amount
                      </p>
                      <p className="text-sm font-semibold text-zinc-900">
                        ₹{new Intl.NumberFormat("en-IN").format(activeBooking.price)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Note */}
                {activeBooking?.note && (
                  <div className="flex items-start gap-3 bg-zinc-50 rounded-xl px-4 py-3.5 border border-zinc-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">
                        Your Note
                      </p>
                      <p className="text-sm text-zinc-700 leading-relaxed">{activeBooking.note}</p>
                    </div>
                  </div>
                )}

                {/* Status / Actions */}
                {isConfirmed ? (
                  isVisit ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-0.5">Visit Scheduled</p>
                        <p className="text-sm text-blue-700">
                          {activeBooking.date
                            ? new Date(activeBooking.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : activeBooking.date}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          You'll receive a call to confirm the visit.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <p className="text-sm text-amber-800 font-medium">
                          Complete your payment to finalize the booking.
                        </p>
                      </div>
                      <Link to={`/pay/${activeBooking._id}/${activeBooking.price}`}>
                        <button className="w-full py-3.5 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all">
                          <CreditCard className="w-4 h-4" />
                          Pay via eSewa
                        </button>
                      </Link>
                    </div>
                  )
                ) : (
                  /* Timeline */
                  <div className="relative pt-1">
                    {/* Connector line */}
                    <div className="absolute left-4 top-5 h-[calc(100%-3.5rem)] w-px bg-zinc-100 z-0" />
                    <TimelineStep
                      number={1}
                      status="done"
                      label="Booking Placed"
                      sublabel="We've received your booking request."
                    />
                    <TimelineStep
                      number={2}
                      status="active"
                      label="Awaiting Confirmation"
                      sublabel="The host is reviewing your booking."
                    />
                    <TimelineStep
                      number={3}
                      status="pending"
                      label={
                        isVisit
                          ? `Visit on ${
                              activeBooking.date
                                ? new Date(activeBooking.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : activeBooking.date
                            }`
                          : "Complete Payment"
                      }
                      sublabel={
                        isVisit
                          ? "Your visit will be scheduled."
                          : "Payment will be required."
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookedProp;