import React, { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";

import * as brokerApi from "@/api/broker";
import { getErrorMessage } from "@/lib/errors";
import { formatVisitDate } from "@/lib/visit";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function toLocalDateInput(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalTimeInput(isoOrDate) {
  const d = isoOrDate ? new Date(isoOrDate) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

function defaultFutureSlot() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() <= 30 ? 30 : 60, 0, 0);
  return d;
}

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
];

export function ScheduleMeetSheet({
  open,
  onOpenChange,
  visit,
  initialSlotIso = null,
  onScheduled,
}) {
  const { toast } = useToast();
  const isReschedule = visit?.visitStatus === "scheduled";

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState("30");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const todayMin = useMemo(() => toLocalDateInput(new Date()), []);

  useEffect(() => {
    if (!open || !visit) return;
    const candidateIso =
      initialSlotIso ||
      visit.schedule?.startAt ||
      (visit.preferredSlots || []).find((s) => new Date(s).getTime() > Date.now()) ||
      null;

    const baseDate =
      candidateIso && new Date(candidateIso).getTime() > Date.now()
        ? new Date(candidateIso)
        : defaultFutureSlot();

    setDate(toLocalDateInput(baseDate));
    setTime(toLocalTimeInput(baseDate));
    setDurationMin(String(visit.schedule?.durationMin || 30));
    setMeetingPoint(visit.schedule?.meetingPoint || visit.property?.location || "");
    setNotes(visit.schedule?.notes || "");
    setErrors({});
  }, [open, visit, initialSlotIso]);

  const applySlot = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    setDate(toLocalDateInput(d));
    setTime(toLocalTimeInput(d));
    setErrors((prev) => ({ ...prev, date: undefined, time: undefined }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!visit?._id || submitting) return;

    const nextErrors = {};
    if (!date) nextErrors.date = "Select date";
    if (!time) nextErrors.time = "Select time";

    let startAtIso = null;
    if (date && time) {
      const combined = new Date(`${date}T${time}`);
      if (Number.isNaN(combined.getTime())) {
        nextErrors.date = "Invalid date";
      } else if (combined.getTime() <= Date.now() + 60 * 1000) {
        nextErrors.time = "Must be in the future";
      } else {
        startAtIso = combined.toISOString();
      }
    }

    if (!meetingPoint.trim()) {
      nextErrors.meetingPoint = "Enter meeting point";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !startAtIso) return;

    setSubmitting(true);
    try {
      const res = await brokerApi.scheduleVisit(visit._id, {
        startAt: startAtIso,
        durationMin: Number(durationMin) || 30,
        meetingPoint: meetingPoint.trim(),
        notes: notes.trim(),
      });
      toast({
        variant: "success",
        title: isReschedule ? "Visit rescheduled" : "Visit scheduled",
      });
      onScheduled?.(res.visit);
      onOpenChange?.(false);
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not save schedule",
        description: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const preferredSlots = visit?.preferredSlots || [];

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!submitting) onOpenChange?.(v);
      }}
      dismissible={!submitting}
      title={isReschedule ? "Reschedule Visit" : "Schedule Visit"}
      description={visit?.property?.title || undefined}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isReschedule ? "Save Changes" : "Confirm Meet"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {preferredSlots.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Preferred slots</p>
            <div className="flex flex-wrap gap-1.5">
              {preferredSlots.map((slot, idx) => {
                const isPast = new Date(slot).getTime() <= Date.now();
                const selected =
                  date === toLocalDateInput(slot) && time === toLocalTimeInput(slot);
                return (
                  <button
                    key={`${slot}-${idx}`}
                    type="button"
                    disabled={isPast}
                    onClick={() => applySlot(slot)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : isPast
                          ? "cursor-not-allowed border-border text-muted-foreground line-through opacity-50"
                          : "border-border bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    {formatVisitDate(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required error={errors.date}>
            <Input
              type="date"
              min={todayMin}
              value={date}
              data-autofocus=""
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((p) => ({ ...p, date: undefined }));
              }}
            />
          </Field>

          <Field label="Time" required error={errors.time}>
            <Input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setErrors((p) => ({ ...p, time: undefined }));
              }}
            />
          </Field>
        </div>

        <Field label="Duration">
          <Select value={durationMin} onChange={(e) => setDurationMin(e.target.value)}>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Meeting Point" required error={errors.meetingPoint}>
          <div className="relative">
            <MapPin
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={meetingPoint}
              onChange={(e) => {
                setMeetingPoint(e.target.value);
                setErrors((p) => ({ ...p, meetingPoint: undefined }));
              }}
              placeholder="Landmark or gate"
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Note (optional)">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Directions or instructions..."
          />
        </Field>
      </form>
    </Sheet>
  );
}
