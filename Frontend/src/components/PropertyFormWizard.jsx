import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Film,
  X,
} from "lucide-react";

import api from "../api/client";
import { AppContext } from "../contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatBytes, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 15;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const AMENITIES = [
  "Parking",
  "Wi-Fi",
  "Furnished",
  "Balcony",
  "Garden",
  "Security",
  "24/7 Water",
  "Solar/Backup",
  "Elevator",
  "AC",
];

function makeNewImageItem(file) {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
    kind: "new",
    file,
    url: URL.createObjectURL(file),
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
        : "1",
    washrooms:
      initialProperty?.washrooms !== undefined && initialProperty?.washrooms !== null
        ? String(initialProperty.washrooms)
        : "1",
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
      ? initialProperty.images.filter(Boolean).map((url, idx) => ({
          id: `existing-${idx}-${url}`,
          kind: "existing",
          url,
        }))
      : [],
  );

  const [existingVideo, setExistingVideo] = useState(() =>
    initialProperty?.video?.url ? initialProperty.video : null,
  );
  const [removeVideo, setRemoveVideo] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const videoUrlRef = useRef(videoPreviewUrl);
  videoUrlRef.current = videoPreviewUrl;

  useEffect(() => {
    return () => {
      for (const p of photosRef.current) {
        if (p.kind === "new" && p.url) URL.revokeObjectURL(p.url);
      }
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  const isPlot = form.propertyType === "Plot";

  const updateField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const toggleAmenity = (item) => {
    setForm((p) => ({
      ...p,
      amenities: p.amenities.includes(item)
        ? p.amenities.filter((a) => a !== item)
        : [...p.amenities, item],
    }));
  };

  const handlePhotoFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList || []).filter((f) =>
        f.type.startsWith("image/"),
      );
      const valid = incoming.filter((f) => f.size <= MAX_IMAGE_BYTES);
      if (valid.length < incoming.length) {
        toast({ title: "Photos must be under 10 MB each", variant: "error" });
      }
      if (!valid.length) return;
      setPhotos((prev) => {
        const remaining = MAX_IMAGES - prev.length;
        return [...prev, ...valid.slice(0, Math.max(0, remaining)).map(makeNewImageItem)];
      });
      setErrors((p) => ({ ...p, photos: "" }));
    },
    [toast],
  );

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      const item = prev[idx];
      if (item?.kind === "new" && item.url) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const movePhoto = (idx, delta) => {
    setPhotos((prev) => {
      const to = idx + delta;
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
    if (!file.type.startsWith("video/")) {
      toast({ title: "Select a valid video file", variant: "error" });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast({
        title: "Video exceeds 50 MB limit",
        description: `Selected file is ${formatBytes(file.size)}.`,
        variant: "error",
      });
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setVideoDuration(0);
    setRemoveVideo(false);
  };

  const clearVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl("");
    setVideoDuration(0);
    if (existingVideo) {
      setExistingVideo(null);
      setRemoveVideo(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErr = {};
    if (!form.title.trim()) nextErr.title = "Required";
    if (!form.price || !(Number(String(form.price).replace(/,/g, "")) > 0)) {
      nextErr.price = "Enter a valid price";
    }
    if (!form.location.trim()) nextErr.location = "Required";
    if (!form.description.trim()) nextErr.description = "Required";
    if (photos.length === 0) nextErr.photos = "Add at least one photo";

    if (Object.keys(nextErr).length > 0) {
      setErrors(nextErr);
      return;
    }

    const fd = new FormData();
    if (isEdit && initialProperty?._id) fd.append("_id", initialProperty._id);
    fd.append("title", form.title.trim());
    fd.append("sellingType", form.sellingType);
    fd.append("propertyType", form.propertyType);
    fd.append("price", String(form.price).replace(/,/g, "").trim());
    fd.append("location", form.location.trim());
    fd.append("description", form.description.trim());
    fd.append("rooms", isPlot ? "0" : String(form.rooms || "1"));
    fd.append("washrooms", isPlot ? "0" : String(form.washrooms || "1"));
    if (form.area.trim()) fd.append("area", form.area.trim());
    fd.append("amenities", JSON.stringify(form.amenities));

    if (isEdit) {
      const keepUrls = photos.filter((p) => p.kind === "existing").map((p) => p.url);
      fd.append("keepImages", JSON.stringify(keepUrls));
      if (removeVideo && !videoFile) fd.append("removeVideo", "true");
    }

    for (const p of photos) {
      if (p.kind === "new" && p.file) fd.append("images", p.file);
    }
    if (videoFile) fd.append("video", videoFile);

    try {
      setSubmitting(true);
      setUploadPct(0);
      const url = isEdit ? "/api/property/edit-property" : "/api/property/add-property";
      const res = await api.post(url, fd, {
        onUploadProgress: (evt) => {
          if (evt.total) setUploadPct(Math.round((evt.loaded * 100) / evt.total));
        },
      });

      if (res.status === 200) {
        const propId = isEdit ? initialProperty._id : res.data?.property;
        if (!isEdit && propId) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  myProperties: [...(prev.myProperties || []), { propId }],
                }
              : prev,
          );
        }
        refreshUser?.();
        toast({
          title: isEdit ? "Listing updated" : "Listing published",
          variant: "success",
        });
        navigate(propId ? `/my/${propId}` : "/profile");
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.response?.data?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const activeVideoSrc = videoPreviewUrl || existingVideo?.url || "";

  return (
    <div className="mx-auto max-w-2xl py-4 pb-16 sm:py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {isEdit ? "Edit listing" : "New listing"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Media Upload: Photos + Video */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary/40 text-xs font-semibold text-foreground transition hover:border-foreground/40"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              <span>Add photos ({photos.length}/{MAX_IMAGES})</span>
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary/40 text-xs font-semibold text-foreground transition hover:border-foreground/40"
            >
              <Film className="size-5" aria-hidden="true" />
              <span>{activeVideoSrc ? "Replace video" : "Add video (max 50 MB)"}</span>
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handlePhotoFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoPick}
              className="hidden"
            />
          </div>

          {errors.photos ? (
            <p className="text-xs font-medium text-destructive">{errors.photos}</p>
          ) : null}

          {/* Photo Previews */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                >
                  <img src={p.url} alt="" className="size-full object-cover" />
                  {idx === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-black/70 text-white"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                  {photos.length > 1 ? (
                    <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => movePhoto(idx, -1)}
                        aria-label="Move left"
                        className="inline-flex size-6 items-center justify-center rounded-full bg-black/65 text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === photos.length - 1}
                        onClick={() => movePhoto(idx, 1)}
                        aria-label="Move right"
                        className="inline-flex size-6 items-center justify-center rounded-full bg-black/65 text-white disabled:opacity-30"
                      >
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* Video Preview */}
          {activeVideoSrc ? (
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video
                src={activeVideoSrc}
                width={640}
                height={360}
                controls
                playsInline
                onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration || 0)}
                className="aspect-video w-full object-cover"
              />
              <div className="flex items-center justify-between bg-secondary px-3.5 py-2 text-xs text-foreground">
                <span className="truncate font-medium">
                  {videoFile
                    ? `${videoFile.name} · ${formatBytes(videoFile.size)}`
                    : "Uploaded video tour"}
                  {videoDuration > 0 ? ` · ${formatDuration(videoDuration)}` : ""}
                </span>
                <button
                  type="button"
                  onClick={clearVideo}
                  className="ml-3 shrink-0 font-semibold text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Type & Listing Mode Pills */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground">Property type</span>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border p-1">
              {["House", "Room", "Plot"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateField("propertyType", t)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-semibold transition-colors",
                    form.propertyType === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground">Listing for</span>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border p-1">
              {[
                { val: "Rent System", label: "Rent" },
                { val: "Selling System", label: "Sale" },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => updateField("sellingType", s.val)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-semibold transition-colors",
                    form.sellingType === s.val
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Core Fields */}
        <Field label="Title" error={errors.title} required>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g. Modern 2BHK Apartment in Jhamsikhel"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={form.sellingType === "Rent System" ? "Monthly rent (रू.)" : "Price (रू.)"}
            error={errors.price}
            required
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="25000"
            />
          </Field>

          <Field label="Location" error={errors.location} required>
            <Input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Lalitpur, Kathmandu"
            />
          </Field>
        </div>

        {/* Specs Row */}
        <div className={cn("grid gap-3", isPlot ? "grid-cols-1" : "grid-cols-3")}>
          {!isPlot ? (
            <>
              <Field label="Rooms">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.rooms}
                  onChange={(e) => updateField("rooms", e.target.value)}
                />
              </Field>
              <Field label="Washrooms">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.washrooms}
                  onChange={(e) => updateField("washrooms", e.target.value)}
                />
              </Field>
            </>
          ) : null}
          <Field label="Area (sq.ft)">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.area}
              onChange={(e) => updateField("area", e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground">Amenities</span>
          <div className="flex flex-wrap gap-1.5">
            {AMENITIES.map((item) => {
              const active = form.amenities.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAmenity(item)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <Field label="Description" error={errors.description} required>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe key details, neighborhood, and availability…"
          />
        </Field>

        {/* Upload Progress + Submit */}
        {submitting && uploadPct > 0 ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Uploading media…</span>
              <span className="tabular-nums">{uploadPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-foreground transition-[width] duration-150"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="w-full rounded-full"
        >
          {isEdit ? "Save changes" : "Publish listing"}
        </Button>
      </form>
    </div>
  );
}
