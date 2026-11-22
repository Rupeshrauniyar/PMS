import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Home as HomeIcon,
  DoorOpen,
  LandPlot,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Film,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  UploadCloud,
  Sparkles,
  MapPin,
  Bed,
  Bath,
  Ruler,
} from "lucide-react";

import api from "../api/client";
import { AppContext } from "../contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatBytes, formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 15;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

const PRESET_AMENITIES = [
  "Parking",
  "Wi-Fi",
  "Furnished",
  "Balcony",
  "Garden",
  "Security",
  "24/7 Water",
  "Solar/Backup",
  "Modular Kitchen",
  "Pet Friendly",
  "Elevator",
  "Air Conditioning",
];

const STEPS = [
  { id: 1, title: "Basics", subtitle: "Type, title & pricing" },
  { id: 2, title: "Details", subtitle: "Space & amenities" },
  { id: 3, title: "Media", subtitle: "Photos & video tour" },
  { id: 4, title: "Review", subtitle: "Verify & publish" },
];

const PROPERTY_TYPES = [
  { value: "House", label: "House", desc: "Standalone or multi-floor home", icon: HomeIcon },
  { value: "Room", label: "Room / Flat", desc: "Single room, studio, or apartment", icon: DoorOpen },
  { value: "Plot", label: "Plot / Land", desc: "Residential or commercial land", icon: LandPlot },
];

const SELLING_TYPES = [
  { value: "Rent System", label: "For Rent", desc: "Monthly rental listing" },
  { value: "Selling System", label: "For Sale", desc: "One-time purchase price" },
];

function makeNewImageItem(file) {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `new-${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
    kind: "new",
    file,
    url: URL.createObjectURL(file),
  };
}

function makeExistingImageItem(url, idx) {
  return {
    id: `existing-${idx}-${url}`,
    kind: "existing",
    url,
  };
}

export default function PropertyFormWizard({
  mode = "create",
  initialProperty = null,
}) {
  const isEdit = mode === "edit";
  const navigate = useNavigate();
  const { setUser, refreshUser } = useContext(AppContext);
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [customAmenity, setCustomAmenity] = useState("");

  const [form, setForm] = useState(() => ({
    title: initialProperty?.title || "",
    sellingType: initialProperty?.sellingType || "Rent System",
    propertyType: initialProperty?.propertyType || "House",
    price:
      initialProperty?.price !== undefined && initialProperty?.price !== null
        ? String(initialProperty.price)
        : "",
    location: initialProperty?.location || "",
    description: initialProperty?.description || "",
    rooms:
      initialProperty?.rooms !== undefined && initialProperty?.rooms !== null
        ? String(initialProperty.rooms)
        : "",
    washrooms:
      initialProperty?.washrooms !== undefined && initialProperty?.washrooms !== null
        ? String(initialProperty.washrooms)
        : "",
    area:
      initialProperty?.area !== undefined && initialProperty?.area !== null
        ? String(initialProperty.area)
        : "",
    amenities: Array.isArray(initialProperty?.amenities)
      ? initialProperty.amenities.filter(Boolean)
      : [],
  }));

  const [photos, setPhotos] = useState(() =>
    Array.isArray(initialProperty?.images)
      ? initialProperty.images.filter(Boolean).map(makeExistingImageItem)
      : [],
  );

  // Video state: existing video (on edit) vs newly picked File
  const [existingVideo, setExistingVideo] = useState(() =>
    initialProperty?.video?.url ? initialProperty.video : null,
  );
  const [removeVideo, setRemoveVideo] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const videoInputRef = useRef(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const videoUrlRef = useRef(videoPreviewUrl);
  videoUrlRef.current = videoPreviewUrl;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      for (const p of photosRef.current) {
        if (p.kind === "new" && p.url) URL.revokeObjectURL(p.url);
      }
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  const isPlot = form.propertyType === "Plot";
  const isRoom = form.propertyType === "Room";

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleAmenity = (item) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== item)
          : [...prev.amenities, item],
      };
    });
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (trimmed.length > 40) {
      toast({
        title: "Amenity too long",
        description: "Keep custom amenities under 40 characters.",
        variant: "error",
      });
      return;
    }
    if (!form.amenities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
    }
    setCustomAmenity("");
  };

  const handlePhotoFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList || []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (incoming.length === 0) return;

      const oversized = incoming.filter((f) => f.size > MAX_IMAGE_BYTES);
      if (oversized.length > 0) {
        toast({
          title: "Photo exceeds 10 MB",
          description: `"${oversized[0].name}" (${formatBytes(oversized[0].size)}) is over 10 MB.`,
          variant: "error",
        });
      }

      const valid = incoming.filter((f) => f.size <= MAX_IMAGE_BYTES);
      if (valid.length === 0) return;

      setPhotos((prev) => {
        const slotsLeft = MAX_IMAGES - prev.length;
        if (slotsLeft <= 0) {
          toast({
            title: `Maximum ${MAX_IMAGES} photos allowed`,
            variant: "error",
          });
          return prev;
        }
        const accepted = valid.slice(0, slotsLeft);
        if (accepted.length < valid.length) {
          toast({
            title: `Only ${MAX_IMAGES} photos allowed`,
            description: `Added the first ${accepted.length} photo(s).`,
          });
        }
        return [...prev, ...accepted.map(makeNewImageItem)];
      });
      setErrors((prev) => ({ ...prev, photos: "" }));
    },
    [toast],
  );

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      const target = prev[idx];
      if (target?.kind === "new" && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const movePhoto = (idx, dir) => {
    setPhotos((prev) => {
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleVideoPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setVideoError("");
    if (!file.type.startsWith("video/")) {
      const msg = "Please choose a valid video file (MP4, WebM, MOV).";
      setVideoError(msg);
      toast({ title: "Invalid video format", description: msg, variant: "error" });
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      const msg = `The video must be 50 MB or smaller (selected file is ${formatBytes(file.size)}).`;
      setVideoError(msg);
      toast({ title: "Video exceeds 50 MB limit", description: msg, variant: "error" });
      return;
    }

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    const nextUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(nextUrl);
    setVideoDuration(0);
    setRemoveVideo(false);
  };

  const handleClearVideo = () => {
    setVideoError("");
    if (videoFile) {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(null);
      setVideoPreviewUrl("");
      setVideoDuration(0);
    } else if (existingVideo?.url) {
      setExistingVideo(null);
      setRemoveVideo(true);
    }
  };

  const validateStep = (targetStep) => {
    const e = {};
    if (targetStep === 1 || targetStep === "all") {
      if (!form.title.trim()) e.title = "Title is required";
      else if (form.title.trim().length < 3) e.title = "Minimum 3 characters";

      const priceNum = Number(String(form.price).replace(/,/g, ""));
      if (!form.price || !Number.isFinite(priceNum) || priceNum <= 0) {
        e.price = "Enter a valid price greater than 0";
      }

      if (!form.location.trim()) e.location = "Location is required";
      else if (form.location.trim().length < 5) {
        e.location = "Enter a more specific address or locality (min 5 chars)";
      }

      if (!form.description.trim()) e.description = "Description is required";
      else if (form.description.trim().length < 10) {
        e.description = "Describe the property in at least 10 characters";
      }
    }

    if (targetStep === 2 || targetStep === "all") {
      if (!isPlot) {
        if (!form.rooms || Number(form.rooms) <= 0) {
          e.rooms = "Enter number of rooms";
        }
        if (!form.washrooms || Number(form.washrooms) <= 0) {
          e.washrooms = "Enter number of washrooms";
        }
      }
      if (!isRoom && (!form.area || Number(form.area) <= 0)) {
        e.area = "Area in sq.ft is required";
      }
    }

    if (targetStep === 3 || targetStep === "all") {
      if (photos.length === 0) {
        e.photos = "Upload at least 1 photo of the property";
      }
      if (photos.length > MAX_IMAGES) {
        e.photos = `Maximum ${MAX_IMAGES} photos allowed`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep("all")) {
      toast({
        title: "Please review missing fields",
        description: "Check highlighted fields before publishing.",
        variant: "error",
      });
      return;
    }

    const fd = new FormData();
    if (isEdit && initialProperty?._id) {
      fd.append("_id", initialProperty._id);
    }
    fd.append("title", form.title.trim());
    fd.append("sellingType", form.sellingType);
    fd.append("propertyType", form.propertyType);
    fd.append("location", form.location.trim());
    fd.append("price", String(form.price).replace(/,/g, "").trim());
    fd.append("description", form.description.trim());
    fd.append("rooms", isPlot ? "0" : String(form.rooms || 0));
    fd.append("washrooms", isPlot ? "0" : String(form.washrooms || 0));
    if (form.area) fd.append("area", String(form.area));
    fd.append("amenities", JSON.stringify(form.amenities));

    if (isEdit) {
      const keptUrls = photos
        .filter((p) => p.kind === "existing")
        .map((p) => p.url);
      fd.append("keepImages", JSON.stringify(keptUrls));
    }

    for (const p of photos) {
      if (p.kind === "new" && p.file) {
        fd.append("images", p.file);
      }
    }

    if (videoFile) {
      fd.append("video", videoFile);
    } else if (isEdit && removeVideo) {
      fd.append("removeVideo", "true");
    }

    try {
      setSubmitting(true);
      setUploadPct(5);
      const endpoint = isEdit
        ? "/api/property/edit-property"
        : "/api/property/add-property";

      const res = await api.post(endpoint, fd, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.min(98, Math.max(5, Math.round((evt.loaded * 100) / evt.total)));
            setUploadPct(pct);
          }
        },
      });

      setUploadPct(100);
      const returnedProp = res.data?.property;
      const newId =
        typeof returnedProp === "object" && returnedProp?._id
          ? returnedProp._id
          : returnedProp || initialProperty?._id;

      if (!isEdit && newId) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            myProperties: [...(prev.myProperties || []), { propId: newId }],
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
        title: isEdit ? "Listing updated!" : "Property published!",
        description: isEdit
          ? "Your changes and media are now live."
          : "Your listing is live on Propatyc.",
        variant: "success",
      });

      if (newId) {
        navigate(`/my/${newId}`);
      } else {
        navigate("/profile");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Could not save property. Please check your connection and media sizes.";
      toast({
        title: isEdit ? "Update failed" : "Publish failed",
        description: msg,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
      setUploadPct(0);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-5 pb-28 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
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
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {isEdit ? "Edit property listing" : "List a property"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEdit
              ? "Update details, reorder photos, or replace the walkthrough video."
              : "Share photos and an optional 50 MB video tour to attract verified buyers."}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  if (s.id < step || validateStep(step)) setStep(s.id);
                }}
                className={cn(
                  "flex w-full flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
                  active
                    ? "border-brand bg-brand-soft/60 text-foreground"
                    : done
                      ? "border-success/35 bg-success-soft/40 text-foreground"
                      : "border-border/70 bg-card/60 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                      active
                        ? "bg-brand text-brand-foreground"
                        : done
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden="true" /> : s.id}
                  </span>
                  <span className="text-xs font-bold sm:text-sm">{s.title}</span>
                </div>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {s.subtitle}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Step 1: Basics */}
      {step === 1 ? (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="mb-2.5 text-[13px] font-semibold text-foreground/90">
                Listing purpose
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SELLING_TYPES.map((st) => {
                  const selected = form.sellingType === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => updateField("sellingType", st.value)}
                      className={cn(
                        "flex flex-col items-start rounded-2xl border p-4 text-left transition-all",
                        selected
                          ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                          : "border-border bg-card hover:border-foreground/25",
                      )}
                    >
                      <span className="text-sm font-bold text-foreground">
                        {st.label}
                      </span>
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {st.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-[13px] font-semibold text-foreground/90">
                Property category
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PROPERTY_TYPES.map((pt) => {
                  const Icon = pt.icon;
                  const selected = form.propertyType === pt.value;
                  return (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => updateField("propertyType", pt.value)}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all sm:flex-col",
                        selected
                          ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                          : "border-border bg-card hover:border-foreground/25",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          selected ? "text-brand" : "text-muted-foreground",
                        )}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-bold text-foreground">{pt.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{pt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field
              label="Listing title"
              required
              error={errors.title}
              hint="Highlight key appeal — e.g., Sunny 3BHK House with Garden in Jhamsikhel"
            >
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., Modern 2BHK Apartment near Patan Durbar"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={
                  form.sellingType === "Rent System"
                    ? "Monthly Rent (Rs.)"
                    : "Total Asking Price (Rs.)"
                }
                required
                error={errors.price}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder={form.sellingType === "Rent System" ? "25000" : "18500000"}
                />
              </Field>

              <Field
                label="Location / Address"
                required
                error={errors.location}
              >
                <Input
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g., Lazimpat, Kathmandu"
                />
              </Field>
            </div>

            <Field
              label="Description"
              required
              error={errors.description}
              hint="Share layout details, sunlight, water supply, road access, and nearby landmarks."
            >
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe what makes this property special…"
              />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 2: Details & Amenities */}
      {step === 2 ? (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {!isPlot ? (
                <>
                  <Field label="Rooms / Bedrooms" required error={errors.rooms}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={form.rooms}
                      onChange={(e) => updateField("rooms", e.target.value)}
                      placeholder="e.g., 3"
                    />
                  </Field>
                  <Field label="Washrooms" required error={errors.washrooms}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={form.washrooms}
                      onChange={(e) => updateField("washrooms", e.target.value)}
                      placeholder="e.g., 2"
                    />
                  </Field>
                </>
              ) : null}

              <Field
                label="Total Area (sq.ft)"
                required={!isRoom}
                error={errors.area}
                hint={isRoom ? "Optional for single rooms" : undefined}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  placeholder="e.g., 1450"
                />
              </Field>
            </div>

            {/* Amenities */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground/90">
                  Amenities &amp; Features
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tap all amenities included with this property, or add your own.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_AMENITIES.map((item) => {
                  const selected = form.amenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                        selected
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border bg-card text-foreground hover:border-foreground/30",
                      )}
                    >
                      {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom amenities added by user */}
              {form.amenities.some((a) => !PRESET_AMENITIES.includes(a)) ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.amenities
                    .filter((a) => !PRESET_AMENITIES.includes(a))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand"
                      >
                        <span>{custom}</span>
                        <button
                          type="button"
                          onClick={() => toggleAmenity(custom)}
                          aria-label={`Remove ${custom}`}
                          className="inline-flex size-4 items-center justify-center rounded-full hover:bg-brand/20"
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                </div>
              ) : null}

              {/* Add custom amenity */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Add custom amenity (e.g., Borewell, Rooftop Terrace)…"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomAmenity}
                  className="shrink-0"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Add</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 3: Photos & Video Tour */}
      {step === 3 ? (
        <div className="flex flex-col gap-6">
          {/* Photos Section */}
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Property Photos ({photos.length}/{MAX_IMAGES})
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    First photo is the cover image. Up to 15 photos (max 10 MB each). Use arrows to reorder.
                  </p>
                </div>
                {photos.length < MAX_IMAGES ? (
                  <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-input bg-card px-3.5 text-xs font-semibold text-foreground hover:bg-accent">
                    <ImagePlus className="size-4 text-brand" aria-hidden="true" />
                    <span>Add photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handlePhotoFiles(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                ) : null}
              </div>

              {photos.length === 0 ? (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handlePhotoFiles(e.dataTransfer.files);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
                    errors.photos
                      ? "border-destructive bg-danger-soft/40"
                      : "border-border hover:border-brand/60 hover:bg-muted/40",
                  )}
                >
                  <ImagePlus className="size-9 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    Click or drop property photos here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP · up to 15 images · max 10 MB per photo
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      handlePhotoFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((item, idx) => (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted",
                        idx === 0 ? "border-brand ring-2 ring-brand/25" : "border-border",
                      )}
                    >
                      <img
                        src={item.url}
                        alt={`Property photo ${idx + 1}`}
                        width={320}
                        height={240}
                        className="size-full object-cover"
                      />

                      {idx === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-brand-foreground shadow-soft">
                          Cover
                        </span>
                      ) : (
                        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                          #{idx + 1}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>

                      {/* Reorder Controls */}
                      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => movePhoto(idx, -1)}
                          aria-label={`Move photo ${idx + 1} left`}
                          className="inline-flex size-7 items-center justify-center rounded-full bg-black/65 text-white disabled:opacity-30 hover:bg-black/85"
                        >
                          <ArrowLeft className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === photos.length - 1}
                          onClick={() => movePhoto(idx, 1)}
                          aria-label={`Move photo ${idx + 1} right`}
                          className="inline-flex size-7 items-center justify-center rounded-full bg-black/65 text-white disabled:opacity-30 hover:bg-black/85"
                        >
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {errors.photos ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors.photos}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Video Tour Section */}
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Film className="size-4 text-brand" aria-hidden="true" />
                    <h2 className="text-base font-bold text-foreground">
                      Walkthrough Video Tour (Optional)
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Upload 1 walkthrough video (max 50 MB). Plays first on your listing page!
                  </p>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoPick}
                  className="hidden"
                />
              </div>

              {videoFile && videoPreviewUrl ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/40 p-3">
                  <video
                    src={videoPreviewUrl}
                    controls
                    width={640}
                    height={360}
                    preload="metadata"
                    onLoadedMetadata={(e) =>
                      setVideoDuration(e.currentTarget.duration || 0)
                    }
                    className="aspect-video w-full rounded-xl bg-black object-contain"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="brand">New video</Badge>
                      <span className="max-w-52 truncate font-medium text-foreground">
                        {videoFile.name}
                      </span>
                      <span>· {formatBytes(videoFile.size)}</span>
                      {videoDuration > 0 ? (
                        <span>· {formatDuration(videoDuration)}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearVideo}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : existingVideo?.url && !removeVideo ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/40 p-3">
                  <video
                    src={existingVideo.url}
                    poster={existingVideo.thumbnail || undefined}
                    controls
                    width={640}
                    height={360}
                    preload="metadata"
                    className="aspect-video w-full rounded-xl bg-black object-contain"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="success">Current video tour</Badge>
                      {existingVideo.duration ? (
                        <span>Duration: {formatDuration(existingVideo.duration)}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        Replace video
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearVideo}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-brand/60 hover:bg-muted/40"
                >
                  <UploadCloud className="size-8 text-brand" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    Select a walkthrough video
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4, WebM, or MOV · Maximum 50 MB
                  </p>
                </button>
              )}

              {videoError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-destructive"
                >
                  {videoError}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Step 4: Review & Publish */}
      {step === 4 ? (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="brand" className="mb-1.5">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  <span>Ready to {isEdit ? "save" : "publish"}</span>
                </Badge>
                <h2 className="text-lg font-bold text-foreground">
                  Review your listing
                </h2>
              </div>
            </div>

            {/* Summary Preview */}
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/30">
              {photos[0]?.url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={photos[0].url}
                    alt={form.title || "Cover preview"}
                    width={800}
                    height={450}
                    className="size-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <Badge variant="glass">
                      {form.sellingType === "Rent System" ? "For Rent" : "For Sale"}
                    </Badge>
                    <Badge variant="glass">{form.propertyType}</Badge>
                    {videoFile || (existingVideo?.url && !removeVideo) ? (
                      <Badge variant="glass" className="gap-1">
                        <Film className="size-3 text-brand" aria-hidden="true" />
                        <span>Video tour attached</span>
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {form.title || "Untitled"}
                  </h3>
                  <p className="text-xl font-extrabold text-brand tabular-nums">
                    {formatPrice(form.price)}
                    {form.sellingType === "Rent System" ? (
                      <span className="text-xs font-medium text-muted-foreground">/mo</span>
                    ) : null}
                  </p>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-brand" aria-hidden="true" />
                  <span>{form.location}</span>
                </p>

                <div className="flex flex-wrap gap-4 border-t border-border/60 pt-3 text-xs font-semibold text-foreground">
                  {!isPlot ? (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Bed className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        {form.rooms} Rooms
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        {form.washrooms} Washrooms
                      </span>
                    </>
                  ) : null}
                  {form.area ? (
                    <span className="inline-flex items-center gap-1">
                      <Ruler className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {form.area} sq.ft
                    </span>
                  ) : null}
                  <span>{photos.length} photo(s)</span>
                </div>

                {form.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.amenities.map((a) => (
                      <Badge key={a} variant="secondary" className="text-[11px]">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {form.description}
                </p>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {submitting ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-brand/30 bg-brand-soft/40 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>
                    Uploading photos{videoFile ? " & walkthrough video" : ""}…
                  </span>
                  <span className="tabular-nums">{uploadPct}%</span>
                </div>
                <progress
                  max={100}
                  value={uploadPct}
                  className="h-2 w-full overflow-hidden rounded-full"
                >
                  {uploadPct}%
                </progress>
                <p className="text-[11px] text-muted-foreground">
                  Please keep this screen open while media is uploaded and optimized.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Sticky Bottom Wizard Bar */}
      <div className="chrome-fixed-bottom glass fixed inset-x-0 bottom-0 z-40 border-t border-border/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? () => navigate(-1) : goPrev}
            disabled={submitting}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span>{step === 1 ? "Cancel" : "Previous"}</span>
          </Button>

          {step < 4 ? (
            <Button type="button" variant="brand" onClick={goNext}>
              <span>Continue</span>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="brand"
              loading={submitting}
              onClick={handleSubmit}
            >
              <Building2 className="size-4" aria-hidden="true" />
              <span>{isEdit ? "Save changes" : "Publish listing"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
