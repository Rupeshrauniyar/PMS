import { useContext, useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import { Trash2, ChevronDown, ArrowUpRight, CheckCircle2, Users, Building2 } from "lucide-react";
import axios from "axios";
import AlertBox from "../../components/AlertBox";
import Properties from "../../components/Properties";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* ── Collapsible section ── */
const Accordion = ({ title, icon: Icon, open, onToggle, children, badge }) => (
  <div className="border border-zinc-200 rounded-2xl overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-zinc-400" />}
        <span className="text-sm font-semibold text-zinc-700 tracking-wide uppercase">
          {title}
        </span>
        {badge != null && (
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold">
            {badge}
          </span>
        )}
      </div>
      <ChevronDown
        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="border-t border-zinc-100 px-5 pb-5 pt-4">{children}</div>
    </div>
  </div>
);

/* ── Booker card ── */
const BookerCard = ({ booker, onConfirm, isActive }) => (
  <div className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-black">
          {booker.userId.username}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {booker.bType === "visit" ? "Schedule Visit" : "Pay Now"}
        </p>
      </div>
      <span className="text-sm font-semibold text-black shrink-0">
        ₹{booker.price ? new Intl.NumberFormat("en-IN").format(booker.price) : "N/A"}
      </span>
    </div>

    {booker.note && (
      <p className="text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2 leading-relaxed">
        {booker.note}
      </p>
    )}

    {booker.bType === "visit" && booker.date && (
      <p className="text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">Visit date:</span>{" "}
        {new Date(booker.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    )}

    <div className="flex justify-end pt-1">
      {isActive ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-4 py-2 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
        </span>
      ) : (
        <button
          onClick={onConfirm}
          className="text-xs font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Confirm Booking
        </button>
      )}
    </div>
  </div>
);

const MyProp = () => {
  const { user } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(true);

  /* ── Guard ── */
  if (!user?.myProperties?.find((p) => p?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="w-12 h-px bg-black mx-auto mb-6" />
        <h1 className="text-3xl font-light tracking-tight text-black mb-3">
          Not Your Property
        </h1>
        <p className="text-sm text-zinc-500 max-w-xs mb-8 leading-relaxed">
          This listing isn't in your account. View it as a visitor instead.
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
        const response = await axios.post(
          `${import.meta.env.VITE_backendUrl}/api/fetching/get-my-prop`,
          { _id: params.id }
        );
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
    document.body.style.overflow = deleteOpen ? "hidden" : "auto";
  }, [deleteOpen]);

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

  if (!props._id) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-white">
        <p className="text-sm text-zinc-500">No property found.</p>
      </div>
    );
  }

  const HandleDelete = async () => {
    try {
      setDeleteLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/property/delete-property`,
        {
          _id: params?.id,
          propertyType: props.propertyType,
          token: localStorage.getItem("token"),
        }
      );
      if (res.status === 200) {
        setDeleteLoading(false);
        setDeleteOpen(false);
        setSuccess("Property deleted successfully.");
        setPropData({});
      }
    } catch {
      setDeleteLoading(false);
      setDeleteOpen(false);
      setBackendError("Unable to delete property.");
    }
  };

  const handleConfirm = async (userId, bookingId) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_backendUrl}/api/booking/confirm-booking`,
        {
          _id: bookingId,
          userId,
          token: localStorage.getItem("token"),
        }
      );
      if (res.status === 200) {
        setPropData((prev) => ({
          ...prev,
          bookers: prev.bookers.map((b) =>
            b.userId === userId ? { ...b, status: true } : b
          ),
        }));
        setSuccess("Booker confirmed successfully.");
      }
    } catch {
      setBackendError("Unable to confirm booker.");
    }
  };

  const activeBooker = props.bookers.find((b) => b.status);
  const pendingBookers = props.bookers.filter((b) => !b.status);

  return (
    <div className="w-full min-h-screen bg-white overflow-hidden pt-20 pb-24">
      {/* ── Alerts ── */}
      {success && (
        <AlertBox message={success} type="success" onClose={() => setSuccess(null)} />
      )}
      {backendError && (
        <AlertBox message={backendError} type="error" onClose={() => setBackendError(null)} />
      )}

      {/* ── Delete Modal ── */}
      {deleteOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" />
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 w-full max-w-sm p-6 animate-[slideUp_0.2s_ease-out]">
              {deleteLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin w-5 h-5 text-zinc-400" />
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-4 h-4 text-zinc-500" />
                  </div>
                  <h3 className="text-base font-semibold text-black text-center mb-1">
                    Delete Property?
                  </h3>
                  <p className="text-sm text-zinc-500 text-center mb-6 leading-relaxed">
                    This will permanently remove your listing and all associated bookings.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteOpen(false)}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 active:scale-[0.98] transition-all"
                    >
                      Keep Listing
                    </button>
                    <button
                      onClick={HandleDelete}
                      className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Top Bar ── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
            My Listing
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-black">
            Property Dashboard
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors">
              <MoreVertical className="w-4 h-4 text-zinc-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-zinc-100">
            <DropdownMenuItem
              className="text-sm text-zinc-800 cursor-pointer focus:bg-zinc-50 flex items-center gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Accordions ── */}
      <div className="flex flex-col gap-3">

        {/* Accordion 1 — Property Details */}
        <Accordion
          title="Property Details"
          icon={Building2}
          open={propOpen}
          onToggle={() => setPropOpen((p) => !p)}
        >
          <Properties prop={props} />
        </Accordion>

        {/* Accordion 2 — Bookings */}
        <Accordion
          title="Bookings"
          icon={Users}
          open={bookingsOpen}
          onToggle={() => setBookingsOpen((p) => !p)}
          badge={props.bookers.length > 0 ? props.bookers.length : null}
        >
          {props.bookers.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700">No bookings yet</p>
              <p className="text-xs text-zinc-400 mt-1">
                Booking requests will appear here once customers book your property.
              </p>
            </div>
          ) : activeBooker ? (
            /* Active confirmed booker */
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
                Active Booking
              </p>
              <BookerCard booker={activeBooker} isActive={true} />
            </div>
          ) : (
            /* Pending bookers list */
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
                Pending Requests · {pendingBookers.length}
              </p>
              {pendingBookers.length > 0 ? (
                pendingBookers.map((booker, i) => (
                  <BookerCard
                    key={i}
                    booker={booker}
                    isActive={false}
                    onConfirm={() => handleConfirm(booker.userId, booker._id)}
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-400 py-4 text-center">
                  No pending requests.
                </p>
              )}
            </div>
          )}
        </Accordion>
      </div>
    </div>
  );
};

export default MyProp;