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
import axios from "axios";
import AlertBox from "../../components/AlertBox";
import EditProfile from "../auth/EditProfile";
import Signin from "../auth/Signin";

/* ── Small helper: step pill ── */
const StepBadge = ({ number, active }) => (
  <span
    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-colors ${
      active ? "bg-black text-white" : "bg-zinc-100 text-zinc-400"
    }`}
  >
    {number}
  </span>
);

/* ── Collapsible accordion section ── */
const Section = ({ step, title, icon: Icon, open, onToggle, children, disabled }) => (
  <div className="rounded-2xl border border-zinc-200 overflow-hidden">
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
        disabled ? "cursor-default opacity-40" : "hover:bg-zinc-50 cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-3">
        <StepBadge number={step} active={open} />
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold tracking-wide uppercase text-zinc-700">
            {title}
          </span>
        </div>
      </div>
      <ChevronDown
        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-5 pb-5 pt-1 border-t border-zinc-100">{children}</div>
    </div>
  </div>
);

/* ── Field wrapper ── */
const Field = ({ label, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
        {label}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-zinc-400 italic">{hint}</p>}
    {error && (
      <p className="text-xs text-black font-medium flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-black inline-block" />
        {error}
      </p>
    )}
  </div>
);

const inputClass = (hasError) =>
  `w-full px-4 py-3 rounded-xl border text-sm font-mono bg-white transition-all outline-none focus:ring-2 focus:ring-black focus:border-black ${
    hasError ? "border-black ring-1 ring-black" : "border-zinc-200"
  }`;

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
  const [step1Open, setStep1Open] = useState(true);
  const [step2Open, setStep2Open] = useState(false);

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
        token: localStorage.getItem("token"),
      };
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/book`,
        Data
      );
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

  /* ── Guard screens ── */
  if (!params.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-black mx-auto mb-6" />
        <h3 className="text-2xl font-light tracking-tight text-black mb-2">
          No Property Found
        </h3>
        <p className="text-sm text-zinc-400">Please go back and select a property.</p>
      </div>
    );
  }

  if (user?.myProperties?.find((p) => p?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-black mx-auto mb-6" />
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
        <div className="w-12 h-px bg-black mx-auto mb-6" />
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

  return (
    <div className="w-full min-h-screen bg-white overflow-hidden pt-20 pb-24">
      {/* Alerts */}
      {success && (
        <AlertBox message={success} type="success" onClose={() => setSuccess(null)} />
      )}
      {backendError && (
        <AlertBox message={backendError} type="error" onClose={() => setBackendError(null)} />
      )}

      {/* ── Page Header ── */}
      {/* <div className="max-w-lg mx-auto  my-5">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">
          Property · {params.id?.slice(-6).toUpperCase()}
        </p>
        <h1 className="text-3xl font-light tracking-tight text-black">
          Complete Booking
        </h1>
        <div className="mt-2 h-px bg-zinc-100 w-full" />
      </div> */}

      {/* ── Steps ── */}
      <div className="max-w-lg mx-auto mb-10 flex flex-col gap-3">

        {/* Step 1 — Credentials / Sign In */}
        <Section
          step={1}
          title={user ? "Your Details" : "Sign In"}
          icon={User}
          open={step1Open}
          onToggle={() => setStep1Open((p) => !p)}
        >
          {user ? (
            <>
              <div className="">
                <EditProfile
                  error={errors?.contact || null}
                  css={true}
                />
              </div>
              {errors.contact && (
                <p className="text-xs text-black font-medium flex items-center gap-1.5 mt-2">
                  <span className="w-1 h-1 rounded-full bg-black inline-block" />
                  {errors.contact}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!user?.phone || user?.phone.length === 0) {
                    setErrors((prev) => ({
                      ...prev,
                      contact: "Please add a contact number to continue.",
                    }));
                  } else {
                    setErrors((prev) => ({ ...prev, contact: null }));
                    setStep1Open(false);
                    setStep2Open(true);
                  }
                }}
                className="mt-4 w-full py-3 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="">
              <Signin from={location.pathname} css={true} />
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
            <Field label="Booking Type">
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
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      select === opt.value
                        ? "bg-black text-white border-black"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Appointment date — only for visit */}
            {select !== "pay" && (
              <Field
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Appointment Date
                  </span>
                }
                error={errors.date}
              >
                <input
                  type="date"
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, date: "" }));
                    setDate(e.target.value);
                  }}
                  className={inputClass(!!errors.date)}
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
                    <span className="ml-auto text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-medium">
                      Bargained · Original:{" "}
                      {new Intl.NumberFormat("en-IN").format(params.price)}
                    </span>
                  )}
                </span>
              }
              hint="You can negotiate the listed price"
              error={errors.price}
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold pointer-events-none">
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
                  className={`${inputClass(!!errors.price)} pl-8`}
                  required
                />
              </div>
            </Field>

            {/* Note */}
            <Field
              label={
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Note{" "}
                  <span className="normal-case text-zinc-400 font-normal tracking-normal">
                    (optional)
                  </span>
                </span>
              }
            >
              <textarea
                rows={3}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special requests or questions..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm bg-white resize-none outline-none focus:ring-2 focus:ring-black focus:border-black transition-all placeholder:text-zinc-300"
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* ── Sticky Confirm Bar ── */}
      <div className="fixed xl:bottom-0 bottom-13 left-0 w-full z-[998] bg-white/80 backdrop-blur-xl border-t border-zinc-200">
        <div className="max-w-lg mx-auto p-2 flex items-center gap-4">
          {/* Price summary */}
          {params.price && (
            <div className="hidden sm:flex flex-col shrink-0">
              <span className="text-xs text-zinc-400 leading-none mb-0.5">Total</span>
              <span className="text-lg font-semibold text-black tracking-tight">
                ₹{new Intl.NumberFormat("en-IN").format(isBar ? barPrice : params.price)}
              </span>
            </div>
          )}

          <form noValidate onSubmit={handleConfirmBooking} className="flex-1 ">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl cursor-pointer text-white text-sm font-semibold flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Booking
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