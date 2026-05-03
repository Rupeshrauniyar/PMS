import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import {
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  User,
  CalendarDays,
  SlidersHorizontal,
  FileText,
  Tag,
} from "lucide-react";
import api from "../../api/client";
import AlertBox from "../../components/AlertBox";
import EditProfile from "../auth/EditProfile";
import Signin from "../auth/Signin";
import Signup from "../auth/Signup";

/* ─────────────────────────────────────────
   Section colour tokens
   step 1 → amber, step 2 → indigo
───────────────────────────────────────── */
const sectionTheme = {
  1: {
    badge: "bg-amber-500 text-white",
    badgeInactive: "bg-amber-50 text-amber-300",
    border: "border-amber-200",
    header: "hover:bg-amber-50/60",
    iconBar: "bg-amber-50",
    iconColor: "text-amber-500",
    ring: "focus:ring-amber-400 focus:border-amber-400",
    tabActive: "bg-amber-500 text-white shadow-sm",
    tabInactive: "text-zinc-400 hover:text-zinc-600",
    tabBg: "bg-amber-50",
    labelColor: "text-amber-600",
  },
  2: {
    badge: "bg-indigo-600 text-white",
    badgeInactive: "bg-indigo-50 text-indigo-300",
    border: "border-indigo-200",
    header: "hover:bg-indigo-50/60",
    iconBar: "bg-indigo-50",
    iconColor: "text-indigo-500",
    ring: "focus:ring-indigo-400 focus:border-indigo-400",
    labelColor: "text-indigo-600",
  },
};

/* ── Step pill ── */
const StepBadge = ({ number, active }) => {
  const t = sectionTheme[number];
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
        active ? t.badge : t.badgeInactive
      }`}
    >
      {number}
    </span>
  );
};

/* ── Collapsible section ── */
const Section = ({ step, title, icon: Icon, open, onToggle, children, disabled }) => {
  const t = sectionTheme[step];
  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
        open ? t.border : "border-zinc-100"
      } bg-white shadow-sm`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
          disabled
            ? "cursor-default opacity-40"
            : `${t.header} cursor-pointer`
        }`}
      >
        <div className="flex items-center gap-3">
          <StepBadge number={step} active={open} />
          {/* Icon chip */}
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${open ? t.iconBar : "bg-zinc-100"} transition-colors`}>
            <Icon className={`w-4 h-4 transition-colors ${open ? t.iconColor : "text-zinc-400"}`} />
          </span>
          <span
            className={`text-sm font-semibold tracking-wide uppercase transition-colors ${
              open ? "text-zinc-800" : "text-zinc-400"
            }`}
          >
            {title}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? `${t.iconColor} rotate-180` : "text-zinc-300"
          }`}
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-5 pb-5 pt-1 border-t-2 ${open ? t.border : "border-transparent"}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ── Field wrapper ── */
const Field = ({ label, error, hint, children, step = 2 }) => {
  const t = sectionTheme[step];
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={`text-xs font-semibold tracking-widest uppercase ${t.labelColor} flex items-center gap-1`}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-zinc-400 italic">{hint}</p>}
      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          {error}
        </p>
      )}
    </div>
  );
};

const inputClass = (hasError, step = 2) => {
  const ring = sectionTheme[step].ring;
  return `w-full px-4 py-3 rounded-xl border text-sm font-mono bg-white transition-all outline-none focus:ring-2 ${ring} ${
    hasError ? "border-rose-400 ring-1 ring-rose-400" : "border-zinc-200"
  }`;
};

const Book = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const params = useParams();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState("");
  const [select, setSelect] = useState("pay");
  const [note, setNote] = useState("");
  const [barPrice, setBarPrice] = useState(null);
  const [isBar, setIsBar] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);

  const [step1Open, setStep1Open] = useState(!user);
  const [step2Open, setStep2Open] = useState(!!user);
  const [authTab, setAuthTab] = useState("signin");

  const validate = () => {
    const newErrors = {};
    if (!user?.phone || user?.phone.length === 0) {
      newErrors.contact = "Please add a contact number to continue.";
      setStep1Open(true);
      setStep2Open(false);
    }
    if (!params.price || params.price === 0) {
      newErrors.price = "Invalid property price.";
    }
    if (barPrice && (barPrice === "0" || barPrice === "00")) {
      newErrors.price = "Invalid property price.";
    }
    if (select !== "pay" && !date) {
      newErrors.date = "Please select an appointment date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const Data = {
        propId: params.id,
        price: isBar ? barPrice : params.price,
        userId: user?._id,
        date,
        note,
        bType: select,
      };
      const res = await api.post("/api/booking/book", Data);
      if (res.status === 200) {
        setUser((prev) => ({
          ...prev,
          bookedProperties: [...prev.bookedProperties, res.data.booking],
        }));
        setSubmitting(false);
        setSuccess(res.data.message);
        navigate(`/booked/${params.id}`);
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitting(false);
      setBackendError(err.response?.data.message || "Something went wrong.");
    }
  };

  useEffect(() => {
    if (!barPrice) return;
    setIsBar(params.price.toString() !== barPrice.toString());
  }, [barPrice]);

  useEffect(() => {
    if (user) {
      setStep1Open(false);
      setStep2Open(true);
    }
  }, [user]);

  /* ── Guard screens ── */
  if (!params.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-zinc-300 mx-auto mb-6" />
        <h3 className="text-2xl font-light tracking-tight text-black mb-2">No Property Found</h3>
        <p className="text-sm text-zinc-400">Please go back and select a property.</p>
      </div>
    );
  }

  if (user?.myProperties?.find((p) => p?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-amber-400 mx-auto mb-6" />
        <h1 className="text-3xl font-light tracking-tight text-black mb-3">Your Property</h1>
        <p className="text-sm text-zinc-500 max-w-xs mb-8 leading-relaxed">
          You can't book your own listing. View it from your property dashboard instead.
        </p>
        <Link
          to={`/my/${params.id}`}
          className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
        >
          Open Listing <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (user?.bookedProperties?.find((p) => p?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-indigo-400 mx-auto mb-6" />
        <h1 className="text-3xl font-light tracking-tight text-black mb-3">Already Booked</h1>
        <p className="text-sm text-zinc-500 max-w-xs mb-8 leading-relaxed">
          You've already booked this property. Manage it from your bookings.
        </p>
        <Link
          to={`/booked/${params.id}`}
          className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
        >
          View Booking <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const t1 = sectionTheme[1];
  const t2 = sectionTheme[2];

  return (
    <div className="w-full min-h-screen bg-zinc-50 overflow-hidden p-2 pb-28">
      {/* Alerts */}
      {success && (
        <AlertBox message={success} type="success" onClose={() => setSuccess(null)} />
      )}
      {backendError && (
        <AlertBox message={backendError} type="error" onClose={() => setBackendError(null)} />
      )}

      {/* Page header */}
      <div className="max-w-lg mx-auto pt-6 pb-4 px-1">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-1">Property Booking</p>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Complete your booking</h1>
        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-3">
          <div className={`h-1.5 rounded-full flex-1 transition-colors ${step1Open ? "bg-amber-400" : "bg-zinc-200"}`} />
          <div className={`h-1.5 rounded-full flex-1 transition-colors ${step2Open ? "bg-indigo-500" : "bg-zinc-200"}`} />
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="max-w-lg mx-auto flex flex-col gap-3">

        {/* Step 1 — Account */}
        <Section
          step={1}
          title={user ? "Your Details" : "Account"}
          icon={User}
          open={step1Open}
          onToggle={() => setStep1Open((p) => !p)}
        >
          {user ? (
            <div className="mt-2">
              <EditProfile error={errors?.contact || null} css={true} />
              {errors.contact && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  {errors.contact}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              {/* Tab pills */}
              <div className={`flex gap-1 ${t1.tabBg} p-1 rounded-xl mb-3`}>
                {[
                  { key: "signin", label: "Sign In" },
                  { key: "signup", label: "Sign Up" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAuthTab(tab.key)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      authTab === tab.key ? t1.tabActive : t1.tabInactive
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {authTab === "signin" ? (
                <Signin from={location.pathname} css={true} />
              ) : (
                <Signup from={location.pathname} css={true} />
              )}
            </div>
          )}
        </Section>

        {/* Step 2 — Booking Preferences */}
        <Section
          step={2}
          title="Booking Preferences"
          icon={SlidersHorizontal}
          open={step2Open}
          onToggle={() => {
            if (user && user?.phone?.length > 0) setStep2Open((p) => !p);
          }}
          disabled={!user || !user?.phone || user?.phone?.length === 0}
        >
          <div className="mt-3 flex flex-col gap-5">

            {/* Booking type */}
            <Field label="Booking Type" step={2}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "pay", label: "Pay Now" },
                  { value: "visit", label: "Schedule Visit" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setErrors((prev) => ({ ...prev, select: "" }));
                      setSelect(opt.value);
                    }}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      select === opt.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                        : "bg-white text-zinc-500 border-zinc-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Appointment date */}
            {select !== "pay" && (
              <Field
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Appointment Date
                  </span>
                }
                error={errors.date}
                step={2}
              >
                <input
                  type="date"
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, date: "" }));
                    setDate(e.target.value);
                  }}
                  className={inputClass(!!errors.date, 2)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </Field>
            )}

            {/* Price */}
            <Field
              label={
                <span className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Price
                  {isBar && (
                    <span className="ml-auto text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      Bargained · Original: ₹{new Intl.NumberFormat("en-IN").format(params.price)}
                    </span>
                  )}
                </span>
              }
              hint="You can negotiate the listed price"
              error={errors.price}
              step={2}
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-sm font-bold pointer-events-none">
                  ₹
                </span>
                <input
                  type="text"
                  value={
                    isBar
                      ? new Intl.NumberFormat("en-IN").format(barPrice)
                      : new Intl.NumberFormat("en-IN").format(params.price)
                  }
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, price: "" }));
                      const raw = e.target.value.replace(/,/g, "");
                      if (!isNaN(raw)) setBarPrice(raw);
                    } else {
                      setBarPrice("0");
                    }
                  }}
                  className={`${inputClass(!!errors.price, 2)} pl-8`}
                  required
                />
              </div>
            </Field>

            {/* Note */}
            <Field
              label={
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Note{" "}
                  <span className="normal-case text-zinc-400 font-normal tracking-normal text-xs">
                    (optional)
                  </span>
                </span>
              }
              step={2}
            >
              <textarea
                rows={3}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special requests or questions..."
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 text-sm bg-white resize-none outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-zinc-300"
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* ── Sticky Confirm Bar ── */}
      <div className="chrome-fixed-bottom fixed bottom-0 left-0 right-0 z-[998] bg-white/90 backdrop-blur-xl border-t-2 border-zinc-100">
        <div className="chrome-fixed-inner max-w-lg mx-auto p-3 flex items-center gap-4 min-h-[4.25rem]">
          {/* Price summary */}
          {params.price && (
            <div className="hidden sm:flex flex-col shrink-0 pl-1">
              <span className="text-xs text-zinc-400 leading-none mb-0.5 font-medium tracking-wide uppercase">Total</span>
              <span className="text-xl font-bold text-zinc-900 tracking-tight">
                ₹{new Intl.NumberFormat("en-IN").format(isBar ? barPrice : params.price)}
              </span>
              {isBar && (
                <span className="text-xs text-amber-500 font-medium">Negotiated price</span>
              )}
            </div>
          )}

          <form noValidate onSubmit={handleConfirmBooking} className="flex-1">
            <button
              type="submit"
              disabled={submitting || !user}
              className="w-full py-3.5 rounded-xl cursor-pointer text-white text-sm font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {user ? "Confirm Booking" : "Sign in to Book"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Book;