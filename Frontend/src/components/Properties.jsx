import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  Tag,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Share2,
} from "lucide-react";
import SwiperComp from "./Swiper";
import PropertyShareSheet from "./PropertyShareSheet";
import { AppContext } from "../contexts/AppContext";
import api from "../api/client";

const Properties = (props) => {
  const prop = props.prop;
  if (!prop?._id) return null;

  const { user, setUser } = useContext(AppContext);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [hint, setHint] = useState(null);

  let nav = `/view/${prop._id}`;
  if (user?.myProperties?.some((myProp) => String(myProp.propId) === String(prop._id))) {
    nav = `/my/${prop._id}`;
  } else if (
    user?.bookedProperties?.some(
      (bookProp) => String(bookProp.propId) === String(prop._id),
    )
  ) {
    nav = `/booked/${prop._id}`;
  }

  const isSaved = Boolean(
    user?.saved?.some((s) => String(s.propId) === String(prop._id)),
  );
  /** true → API will save; false → unsave */
  const saveAction = !isSaved;

  const handleSave = async () => {
    setHint(null);
    if (!user?._id) {
      setHint("Sign in to save listings.");
      return;
    }
    try {
      setSaveBusy(true);
      const res = await api.post("/api/booking/save-property", {
        id: prop._id,
        action: saveAction,
      });
      if (res.status === 200) {
        setUser((prev) => ({
          ...prev,
          saved: saveAction
            ? [...(prev.saved || []), { propId: prop._id, createdAt: Date.now() }]
            : (prev.saved || []).filter((s) => String(s.propId) !== String(prop._id)),
        }));
      }
    } catch (err) {
      setHint(err.response?.data?.message || "Could not update saved list.");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleShareClick = () => {
    setShareOpen(true);
  };

  return (
    <>
      <div className="w-full h-full bg-card text-card-foreground border border-border rounded-3xl overflow-hidden hover:border-foreground/30 transition-all duration-200 group">
        <Link to={nav} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-3xl">
          {/* Image Section */}
          <div className="relative overflow-hidden aspect-[16/9] lg:aspect-[21/9] xl:aspect-[2/1] bg-muted">
            <SwiperComp
              title={prop.title}
              images={prop.images}
              aspectClassName="aspect-[16/9] lg:aspect-[21/9] xl:aspect-[2/1]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                <Tag size={12} />
                {prop.sellingType}
              </span>
            </div>
          </div>

          <div className="p-4 pb-3">
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2 truncate">
              {prop.description}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {prop.rooms > 0 && (
                <div className="flex items-center gap-1.5 text-foreground">
                  <Bed size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm">{prop.rooms} Rooms</span>
                </div>
              )}
              {prop.washrooms > 0 && (
                <div className="flex items-center gap-1.5 text-foreground">
                  <Bath size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm">{prop.washrooms} Baths</span>
                </div>
              )}
              {prop.area > 0 && (
                <div className="flex items-center gap-1.5 text-foreground">
                  <Ruler size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm">{prop.area} sq ft</span>
                </div>
              )}
              {prop.location && (
                <div className="flex items-center gap-1.5 text-foreground min-w-0">
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{prop.location}</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Price + actions (outside Link — avoids nested interactive elements) */}
        <div className="px-4 pb-4 pt-0 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="min-w-0">
              <span className="text-xl font-bold text-foreground">
                रू. {new Intl.NumberFormat("en-IN").format(prop.price)}
              </span>
              {prop.sellingType === "Rent System" && (
                <span className="text-sm text-muted-foreground">/month</span>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={saveBusy}
                onClick={handleSave}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  isSaved
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
                aria-label={isSaved ? "Unsave listing" : "Save listing"}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {isSaved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleShareClick}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                aria-label="Share listing"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
          {hint ? (
            <p className="mt-2 text-xs text-destructive">{hint}</p>
          ) : null}
        </div>
      </div>

      <PropertyShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        propertyId={prop._id}
        propertyTitle={prop.title || "Property"}
      />
    </>
  );
};

export default Properties;
