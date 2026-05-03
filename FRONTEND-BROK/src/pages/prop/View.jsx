import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
import {
  CheckCircle,
  X,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ArrowUpRight,
  Bed,
  Bath,
  Maximize,
  Building2,
  Tag,
  IndianRupee,
  MapPin,
  ChevronRight,
  ZoomIn,
  Images,
  Shield,
  Star,
  Home,
  Layers,
  Phone,
  BathIcon,
  DoorOpen,
  Share2,
} from "lucide-react";
import api from "../../api/client";
import AlertBox from "../../components/AlertBox";
import EditProfile from "../auth/EditProfile";
import Reccomended from "../../components/Recomended";
import ExtendedProperty from "../../components/ExtendedProperty";

/* ── Fullscreen Image Gallery ── */
const FullscreenGallery = ({ images, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex || 0);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") setCurrent((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft")
        setCurrent((p) => (p - 1 + images.length) % images.length);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur-sm">
        <span className="text-sm font-medium text-zinc-300">
          {current + 1} <span className="text-zinc-600">/</span> {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center relative px-4">
        <button
          onClick={() =>
            setCurrent((p) => (p - 1 + images.length) % images.length)
          }
          className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <img
          key={current}
          src={images[current]}
          alt={`Photo ${current + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        />

        <button
          onClick={() => setCurrent((p) => (p + 1) % images.length)}
          className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="px-4 py-3 bg-black/80 backdrop-blur-sm overflow-x-auto">
        <div className="flex gap-2 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-white scale-105"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Image Grid ── */
const ImageGrid = ({ images, onOpenGallery }) => {
  if (!images?.length) return null;

  const main = images[0];
  const rest = images.slice(1, 5);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-zinc-100">
      {images.length === 1 ? (
        <div
          className="relative aspect-[16/9] cursor-pointer"
          onClick={() => onOpenGallery(0)}
        >
          <img
            src={main}
            alt="Property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-4 grid-rows-2 gap-1 h-72 sm:h-96">
          {/* Main large image */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden"
            onClick={() => onOpenGallery(0)}
          >
            <img
              src={main}
              alt="Main"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Smaller images */}
          {rest.map((img, i) => (
            <div
              key={i}
              className={`relative cursor-pointer overflow-hidden ${
                i === rest.length - 1 && images.length > 5 ? "relative" : ""
              }`}
              onClick={() => onOpenGallery(i + 1)}
            >
              <img
                src={img}
                alt={`Photo ${i + 2}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              {/* "Show all" overlay on last visible */}
              {i === rest.length - 1 && images.length > 5 && (
                <div
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 cursor-pointer"
                  onClick={() => onOpenGallery(i + 1)}
                >
                  <Images className="w-5 h-5 text-white" />
                  <span className="text-white text-xs font-semibold">
                    +{images.length - 5} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View all button */}
      <button
        onClick={() => onOpenGallery(0)}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-black text-xs font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-white transition-colors border border-zinc-200"
      >
        <ZoomIn className="w-3.5 h-3.5" />
        View all photos
      </button>
    </div>
  );
};

/* ── Stat pill ── */
const StatPill = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    zinc: "bg-zinc-50 border-zinc-200 text-zinc-700",
  };
  return (
    <div
      className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border ${colors[color] || colors.zinc}`}
    >
      <Icon className="w-4 h-4 opacity-70" />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[11px] font-medium opacity-70 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
};

const View = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const [props, setPropData] = useState({});
  const params = useParams();
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);

  const openGallery = (index) => {
    setGalleryStart(index);
    setGalleryOpen(true);
  };

  if (user?.myProperties?.find((my) => my?.propId === params.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center bg-white">
        <div className="max-w-md w-full">
          <div className="w-16 h-px bg-black mx-auto mb-8" />
          <h1 className="text-4xl font-light tracking-tight text-black mb-3">
            Wrong Page
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8 font-light">
            This listing belongs to your portfolio. View it through your
            property dashboard.
          </p>
          <Link
            to={`/my/${params.id}`}
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            Open My Property <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  } else if (
    user?.bookedProperties?.find((book) => book?.propId === params.id)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center bg-white">
        <div className="max-w-md w-full">
          <div className="w-16 h-px bg-black mx-auto mb-8" />
          <h1 className="text-4xl font-light tracking-tight text-black mb-3">
            Already Booked
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-8 font-light">
            You have an existing booking for this property. Manage it from your
            bookings page.
          </p>
          <Link
            to={`/booked/${params.id}`}
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            View Booking <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
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
      } catch (err) {
        console.log(err);
        setPropData({});
      } finally {
        setPropertyLoading(false);
      }
    };
    getProperty();
  }, [params.id]);

  useEffect(() => {
    document.body.style.overflow = editOpen || galleryOpen ? "hidden" : "auto";
  }, [editOpen, galleryOpen]);

  if (propertyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-hidden pb-20 pt-28 bg-white p-2">
        <div className="xl:max-w-2xl w-full px-4 animate-pulse space-y-5">
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
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-zinc-100 rounded-full w-full" />
            <div className="h-3 bg-zinc-100 rounded-full w-5/6" />
            <div className="h-3 bg-zinc-100 rounded-full w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  const action = !user?.saved?.some((save) => save.propId === params?.id);

  const handleSave = async () => {
    try {
      if (!user?._id) {
        setBackendError("Sign in to save this property.");
      } else {
        const res = await api.post("/api/booking/save-property", {
          id: params.id,
          action,
        });
        if (res.status === 200) {
          setSuccess(res.data.message);
          setUser((prev) => ({
            ...prev,
            saved: action
              ? [...prev.saved, { propId: params.id, createdAt: Date.now() }]
              : prev.saved.filter((s) => s.propId !== params.id),
          }));
        }
      }
    } catch (err) {
      setBackendError(err.response?.data?.message || "Error saving property");
    }
  };

  // Gather images from props (adjust field names to match your data model)
  const images = props.images || (props.image ? [props.image] : []);

  return (
    <div className="w-full min-h-screen bg-zinc-50 overflow-hidden pb-40 p-2">
      {/* ── Fullscreen Gallery ── */}
      {galleryOpen && images.length > 0 && (
        <FullscreenGallery
          images={images}
          startIndex={galleryStart}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <>
          <div className="fixed z-50 xl:w-[56%] xl:left-[22%] w-[94%] left-[3%] top-4 h-[90vh] flex flex-col">
            <div className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-zinc-200">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <span className="text-base font-semibold tracking-tight text-black">
                  Edit Profile
                </span>
                <button
                  onClick={() => setEditOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X size={18} className="text-zinc-600" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 pb-6">
                <EditProfile />
              </div>
            </div>
          </div>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        </>
      )}

      {/* ── Alerts ── */}
      {success && (
        <AlertBox
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}
      {backendError && (
        <AlertBox
          message={backendError}
          type="error"
          onClose={() => setBackendError(null)}
        />
      )}

      {/* ── Top Nav ── */}
      <div className="w-full max-w-2xl mx-auto  mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-black transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
            !action
              ? "bg-black text-white border-black"
              : "bg-white text-black border-zinc-300 hover:border-black"
          }`}
        >
          {!action ? (
            <>
              <BookmarkCheck className="w-4 h-4" /> Saved
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" /> Save
            </>
          )}
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="w-full max-w-2xl mx-auto  space-y-5">
        {/* Image Grid */}
        {images.length > 0 && (
          <ImageGrid images={images} onOpenGallery={openGallery} />
        )}

        {/* ── Price + Title Hero Card ── */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Price band */}
          <div className="bg-black px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <p className="text-zinc-400 text-[11px] font-semibold tracking-widest uppercase mb-0.5">
                Listed Price
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-xl font-bold tracking-tight">
                  ₹
                  {props.price
                    ? new Intl.NumberFormat("en-IN").format(props.price)
                    : "—"}
                </span>
                {props.sellingType === "Rent System" ? <>/month</> : null}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                <Shield className="w-3 h-3" />
                {/* Verified Listing */}
              </span>
            </div>
          </div>

          {/* Title + location */}
          <div className="px-5 pt-4 ">
            <h1 className="text-xl font-bold text-zinc-900 leading-snug mb-1.5">
              {props.title || props.name || "Property"}
            </h1>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-zinc-100" />

          {/* Stats row */}
          <div className="grid grid-cols-1 gap-2 py-2 px-4 ">
            {[
              props.rooms > 0 && {
                icon: DoorOpen,
                label: props.rooms + " room(s)",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              props.washrooms > 0 && {
                icon: BathIcon,
                label: props.washrooms + " washroom(s)",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              props.location && {
                icon: MapPin,
                label: props.location,
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
              props.area > 0 && {
                icon: Maximize,
                label: `${props.area} sq.ft`,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ]
              .filter(Boolean)
              .map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 ${item.bg} rounded-xl px-3.5 py-3`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  <span className="text-xs font-semibold text-zinc-700 truncate">
                    {item.label}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* ── Description card ── */}
        {props.description && (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <Home className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-800 tracking-wide uppercase">
                About this property
              </h2>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {props.description}
            </p>
          </div>
        )}

        {/* ── Key highlights ── */}
        {/* <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-800 tracking-wide uppercase">
              Key highlights
            </h2>
          </div>
        
        </div> */}

        {/* ── Extended property details (your existing component) ── */}

        {/* ── Contact / CTA nudge ── */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-700 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm mb-0.5">
              Interested in this property?
            </p>
            <p className="text-zinc-400 text-xs">
              Book now or save it for later.
            </p>
          </div>
          <Link to={`/book/${params.id}/${props.price}`}>
            <button className="shrink-0 bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full hover:bg-zinc-100 active:scale-95 transition-all">
              Book Now
            </button>
          </Link>
        </div>

        {/* ── Related Properties ── */}
        <div className="pt-4">
          <div className="flex items-center gap-4 mb-5">
            <h3 className="text-lg font-semibold tracking-tight text-black">
              Related Properties
            </h3>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>
          <Reccomended id={props._id} />
          <p className="text-center text-xs text-zinc-400 mt-8 tracking-widest uppercase">
            End of recommendations
          </p>
        </div>
      </div>

      {/* ── Sticky Booking Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[998] bg-white/90 backdrop-blur-xl border-t border-zinc-200">
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center gap-3">
          {/* Price + status */}
          {props.price && (
            <>
              <div className="hidden sm:flex flex-col gap-0.5 shrink-0 min-w-[80px]">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  Price
                </span>
                <span className="text-xl font-semibold text-black leading-tight">
                  ₹
                  {props.price
                    ? new Intl.NumberFormat("en-IN").format(props.price)
                    : "—"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Available
                  </span>
                </span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-zinc-200 shrink-0" />
            </>
          )}

          {/* Actions */}
          <div className="flex-1 flex flex-col gap-1.5">
            <Link to={`/book/${params.id}/${props.price}`}>
              <button className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black active:scale-[0.97] transition-all">
                <CheckCircle className="w-4 h-4" />
                Book Now
              </button>
            </Link>
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                className={`flex-1 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium  hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition-colors ${
                  !action
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-zinc-300 hover:border-black"
                } `}
              >
                {!action ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" /> Save
                  </>
                )}
              </button>
              <button className="flex-1 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition-colors">
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default View;
