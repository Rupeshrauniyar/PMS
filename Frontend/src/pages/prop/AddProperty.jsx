import React, { useContext, useState, useCallback, useRef } from "react";
import SwiperComp from "../../components/Swiper";
import {
  Banknote,
  Building,
  MapPin,
  Tag,
  Bed,
  Bath,
  Ruler,
  Loader2,
  DoorOpen,
  LayoutDashboard,
  ImagePlus,
  X,
  GripVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import AlertBox from "../../components/AlertBox";
import { AppContext } from "../../contexts/AppContext";

const Field = ({ label, error, children, hint }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
        {label}
        {hint && <span className="ml-1 font-normal normal-case tracking-normal text-zinc-400">{hint}</span>}
      </label>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
    {children}
  </div>
);

const inputCls = (error) =>
  `w-full h-11 pl-10 pr-4 rounded-lg border text-sm bg-white outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-300 ${
    error ? "border-red-400 bg-red-50" : "border-zinc-200 hover:border-zinc-300"
  }`;

const Icon = ({ children }) => (
  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
    {children}
  </span>
);

function makeImageEntry(file) {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`,
    file,
    url: URL.createObjectURL(file),
  };
}

const DT_REORDER = "application/x-pms-reorder-index";

const AddProperty = () => {
  const { setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  /** Synchronous source index — React state from dragStart is often still null when drop fires. */
  const dragFromIndexRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});

  const [propertyDetails, setPropertyDetails] = useState({
    title: "",
    sellingType: "Rent System",
    propertyType: "Room",
    description: "",
    rooms: "",
    washrooms: "",
    area: "",
    price: "",
    location: "",
  });

  const isPlot = propertyDetails.propertyType === "Plot";
  const isRoom = propertyDetails.propertyType === "Room";

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setImages((prev) => [...prev, ...files.map(makeImageEntry)]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setImages((prev) => [...prev, ...files.map(makeImageEntry)]);
    }
    /* Thumbnail reorder drops are handled on each thumb (with stopPropagation). */
  };

  const removeImage = useCallback((index) => {
    setImages((prev) => {
      const row = prev[index];
      if (row?.url) URL.revokeObjectURL(row.url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const resetDragUi = useCallback(() => {
    dragFromIndexRef.current = null;
    setDragIndex(null);
    setDropTargetIndex(null);
  }, []);

  const onThumbDragStart = (e, index) => {
    dragFromIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    try {
      e.dataTransfer.setData(DT_REORDER, String(index));
    } catch {
      /* some browsers restrict custom types */
    }
    setDragIndex(index);
  };

  const onThumbDragEnd = () => {
    resetDragUi();
  };

  const onThumbDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onThumbDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const from = dragFromIndexRef.current;
    if (from !== null && from !== undefined && from !== index) {
      setDropTargetIndex(index);
    }
  };

  const onThumbDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetIndex(null);
    }
  };

  const onThumbDrop = (e, toIndex) => {
    e.preventDefault();
    e.stopPropagation();

    let from = dragFromIndexRef.current;
    if (from === null || from === undefined) {
      from = parseInt(e.dataTransfer.getData(DT_REORDER), 10);
    }
    if (!Number.isFinite(from)) {
      from = parseInt(e.dataTransfer.getData("text/plain"), 10);
    }

    dragFromIndexRef.current = null;

    if (!Number.isFinite(from) || from < 0 || toIndex < 0 || from === toIndex) {
      resetDragUi();
      return;
    }

    setImages((prev) => {
      if (from >= prev.length || toIndex > prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      const insertAt = Math.min(toIndex, next.length);
      next.splice(insertAt, 0, item);
      return next;
    });
    resetDragUi();
  };

  const onGalleryDragOver = (e) => {
    const types = [...e.dataTransfer.types];
    if (types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    } else if (types.includes("text/plain") || types.some((t) => t === DT_REORDER || t.endsWith(DT_REORDER))) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === "price") {
      const raw = value.replace(/,/g, "");
      if (!isNaN(raw)) setPropertyDetails((prev) => ({ ...prev, [id]: raw }));
    } else {
      setPropertyDetails((prev) => ({ ...prev, [id]: value }));
    }
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!propertyDetails.title.trim()) e.title = "Required";
    else if (propertyDetails.title.trim().length < 3) e.title = "Min 3 characters";
    if (!propertyDetails.description.trim()) e.description = "Required";
    else if (propertyDetails.description.trim().length < 10) e.description = "Min 10 characters";
    if (!isPlot) {
      if (!propertyDetails.rooms || +propertyDetails.rooms <= 0) e.rooms = "Required";
      if (!propertyDetails.washrooms || +propertyDetails.washrooms <= 0) e.washrooms = "Required";
    }
    if (!isRoom && (!propertyDetails.area || +propertyDetails.area <= 0)) e.area = "Required";
    if (!propertyDetails.price || +propertyDetails.price <= 0) e.price = "Required";
    if (!propertyDetails.location.trim()) e.location = "Required";
    else if (propertyDetails.location.trim().length < 5) e.location = "Min 5 characters";
    if (images.length === 0) e.images = "At least one image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const formData = new FormData();
    Object.entries(propertyDetails).forEach(([k, v]) => formData.append(k, v));
    images.forEach(({ file }) => formData.append("images", file));
    try {
      const res = await api.post("/api/property/add-property", formData);
      if (res.status === 200) {
        setSuccess("Property added successfully");
        setUser((prev) => ({
          ...prev,
          myProperties: [...prev.myProperties, { propId: res.data.property }],
        }));
      } else {
        setBackendError(res.data.message);
      }
    } catch {
      setBackendError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen   pb-28">
      {success && (
        <AlertBox
          message={success}
          type="success"
          onClose={() => { navigate("/profile"); setSuccess(""); }}
        />
      )}
      {backendError && (
        <AlertBox message={backendError} type="error" onClose={() => setBackendError("")} />
      )}

      <div className="max-w-2xl mx-auto ">
        {/* Page header */}
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Add a property</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Fill in the details below to list your property for rent or sale.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Images ── */}
          <section>
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">Photos</p>
            <div
              className={`rounded-xl border-2 border-dashed transition-colors ${
                errors.images ? "border-red-300 bg-red-50" : "border-zinc-200 hover:border-zinc-300 bg-white"
              }`}
              onDragOver={onGalleryDragOver}
              onDrop={handleDrop}
            >
              {images.length > 0 ? (
                <div>
                  <div className="rounded-t-xl overflow-hidden">
                    <SwiperComp images={images.map((img) => img.url)} />
                  </div>
                  <div className="px-3 pt-2 pb-3 border-t border-zinc-100">
                    <p className="text-[11px] text-zinc-400 mb-2 flex items-center gap-1">
                      <GripVertical className="w-3 h-3 shrink-0" />
                      Drag thumbnails to reorder · first photo is the cover
                    </p>
                    <div className="flex flex-wrap gap-2">
                    {images.map((img, i) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={(e) => onThumbDragStart(e, i)}
                        onDragEnd={onThumbDragEnd}
                        onDragEnter={onThumbDragEnter}
                        onDragOver={(e) => onThumbDragOver(e, i)}
                        onDragLeave={onThumbDragLeave}
                        onDrop={(e) => onThumbDrop(e, i)}
                        className={`relative shrink-0 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                          dragIndex === i
                            ? "opacity-50 border-zinc-400 scale-95"
                            : dropTargetIndex === i
                              ? "border-emerald-500 ring-2 ring-emerald-200"
                              : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-14 h-14 object-cover rounded-md pointer-events-none select-none"
                        />
                        <span
                          className="absolute bottom-0.5 left-0.5 min-w-4.5 h-4 px-1 rounded bg-black/70 text-[10px] font-semibold text-white flex items-center justify-center tabular-nums"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(i);
                          }}
                          className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                    <label
                      htmlFor="images"
                      className="w-14 h-14 rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors shrink-0"
                    >
                      <ImagePlus size={16} className="text-zinc-400" />
                      <input type="file" id="images" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    </div>
                  </div>
                </div>
              ) : (
                <label htmlFor="images" className="flex flex-col items-center justify-center h-48 cursor-pointer">
                  <ImagePlus size={32} className="text-zinc-300 mb-3" />
                  <p className="text-sm text-zinc-500 font-medium">Click or drag photos here</p>
                  <p className="text-xs text-zinc-400 mt-1">PNG, JPG up to 10MB each</p>
                  <input type="file" id="images" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
            {errors.images && <p className="text-xs text-red-500 mt-1.5">{errors.images}</p>}
          </section>

          {/* ── Basic info ── */}
          <section className="space-y-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Basic info</p>

            <Field label="Title" error={errors.title}>
              <div className="relative">
                <Icon><LayoutDashboard size={16} /></Icon>
                <input
                  type="text"
                  id="title"
                  placeholder="e.g., Cozy 2BHK near city centre"
                  className={inputCls(errors.title)}
                  value={propertyDetails.title}
                  onChange={handleChange}
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Listing type" error={errors.sellingType}>
                <div className="relative">
                  <Icon><Tag size={16} /></Icon>
                  <select id="sellingType" className={inputCls(false)} value={propertyDetails.sellingType} onChange={handleChange}>
                    <option value="Rent System">Rent</option>
                    <option value="Selling System">Sale</option>
                  </select>
                </div>
              </Field>
              <Field label="Property type" error={errors.propertyType}>
                <div className="relative">
                  <Icon><Building size={16} /></Icon>
                  <select id="propertyType" className={inputCls(false)} value={propertyDetails.propertyType} onChange={handleChange}>
                    <option value="Room">Room</option>
                    <option value="House">House</option>
                    <option value="Plot">Plot</option>
                  </select>
                </div>
              </Field>
            </div>

            <Field label="Description" error={errors.description}>
              <textarea
                id="description"
                placeholder="Describe the property — location highlights, nearby amenities, condition, etc."
                rows={4}
                style={{ resize: "none" }}
                className={`w-full px-4 py-3 rounded-lg border text-sm bg-white outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-300 ${
                  errors.description ? "border-red-400 bg-red-50" : "border-zinc-200 hover:border-zinc-300"
                }`}
                value={propertyDetails.description}
                onChange={handleChange}
              />
            </Field>
          </section>

          {/* ── Details ── */}
          <section className="space-y-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Property details</p>

            {!isPlot && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rooms" error={errors.rooms}>
                  <div className="relative">
                    <Icon><DoorOpen size={16} /></Icon>
                    <input type="number" id="rooms" placeholder="e.g., 3" className={inputCls(errors.rooms)} value={propertyDetails.rooms} onChange={handleChange} min={0} />
                  </div>
                </Field>
                <Field label="Washrooms" error={errors.washrooms}>
                  <div className="relative">
                    <Icon><Bath size={16} /></Icon>
                    <input type="number" id="washrooms" placeholder="e.g., 2" className={inputCls(errors.washrooms)} value={propertyDetails.washrooms} onChange={handleChange} min={0} />
                  </div>
                </Field>
              </div>
            )}

            <div className={`grid gap-4 ${!isRoom ? "grid-cols-2" : "grid-cols-1"}`}>
              {!isRoom && (
                <Field label="Area (sq ft)" error={errors.area}>
                  <div className="relative">
                    <Icon><Ruler size={16} /></Icon>
                    <input type="number" id="area" placeholder="e.g., 1500" className={inputCls(errors.area)} value={propertyDetails.area} onChange={handleChange} min={0} />
                  </div>
                </Field>
              )}
              <Field
                label="Price"
                hint={propertyDetails.sellingType === "Rent System" ? "(per month)" : ""}
                error={errors.price}
              >
                <div className="relative">
                  <Icon><Banknote size={16} /></Icon>
                  <input
                    type="text"
                    id="price"
                    placeholder="e.g., 15,000"
                    className={inputCls(errors.price)}
                    value={propertyDetails.price ? new Intl.NumberFormat("en-IN").format(propertyDetails.price) : ""}
                    onChange={handleChange}
                  />
                </div>
              </Field>
            </div>

            <Field label="Location" error={errors.location}>
              <div className="relative">
                <Icon><MapPin size={16} /></Icon>
                <input type="text" id="location" placeholder="e.g., Lazimpat, Kathmandu" className={inputCls(errors.location)} value={propertyDetails.location} onChange={handleChange} />
              </div>
            </Field>
          </section>
        </form>
      </div>

      {/* Sticky submit bar */}
      <div className="chrome-fixed-bottom fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-4 py-3 z-50">
        <div className="chrome-fixed-inner max-w-2xl mx-auto shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-11 rounded-lg bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-700 disabled:opacity-60 active:scale-[0.99] transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Publish listing"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;