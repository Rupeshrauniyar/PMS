import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, Sparkles, MapPin } from "lucide-react";

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
  { value: "15", label: "15 minutes — Quick walkthrough" },
  { value: "30", label: "30 minutes — Standard visit" },
  { value: "45", label: "45 minutes — Detailed inspection" },
  { value: "60", label: "60 minutes — Full tour & discussion" },
  { value: "90", label: "90 minutes — Extended evaluation" },
];

/**
 * Sheet for scheduling (from `claimed`) or rescheduling (from `scheduled`)
 * a 3-way site visit between buyer, owner, and broker.
 */
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
    if (!date) nextErrors.date = "Select a visit date.";
    if (!time) nextErrors.time = "Select a start time.";

    let startAtIso = null;
    if (date && time) {
      const combined = new Date(`${date}T${time}`);
      if (Number.isNaN(combined.getTime())) {
        nextErrors.date = "Invalid date or time.";
      } else if (combined.getTime() <= Date.now() + 60 * 1000) {
        nextErrors.time = "Choose a future date and time.";
      } else {
        startAtIso = combined.toISOString();
      }
    }

    if (!meetingPoint.trim()) {
      nextErrors.meetingPoint = "Specify where all 3 parties should meet.";
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
        title: isReschedule
          ? "Site visit rescheduled!"
          : "3-way site visit scheduled!",
        description: "Both the buyer and property owner have been notified.",
      });
      onScheduled?.(res.visit);
      onOpenChange?.(false);
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't save schedule",
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
      title={isReschedule ? "Reschedule 3-Way Site Visit" : "Schedule 3-Way Site Visit"}
      description={
        visit?.property?.title
          ? `Confirming time & meeting point for "${visit.property.title}". Buyer and owner will receive instant confirmation.`
          : "Confirm date, time, and landmark for buyer and property owner."
      }
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={handleSubmit}
            loading={submitting}
          >
            <CalendarClock className="size-4" aria-hidden="true" />
            <span>{isReschedule ? "Confirm Reschedule" : "Confirm & Notify All 3"}</span>
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {preferredSlots.length > 0 ? (
          <div className="rounded-2xl border border-brand/25 bg-brand-soft/45 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="size-3.5 text-brand" aria-hidden="true" />
              <span>Buyer&apos;s preferred slots — tap to fill</span>
            </p>
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
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selected
                        ? "border-brand bg-brand text-brand-foreground"
                        : isPast
                          ? "cursor-not-allowed border-border/50 bg-muted/60 text-muted-foreground line-through opacity-60"
                          : "border-border bg-card text-foreground hover:border-brand/50 hover:bg-accent"
                    }`}
                  >
                    {formatVisitDate(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Visit Date" required error={errors.date}>
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

          <Field label="Start Time" required error={errors.time}>
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

        <Field label="Duration" hint="Between 15 and 90 minutes">
          <Select
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Meeting Point"
          required
          error={errors.meetingPoint}
          hint="Exact landmark, gate, or street corner where buyer, owner & broker will meet"
        >
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
              placeholder="e.g., Main gate near Bhatbhateni, Kalanki"
              className="pl-10"
            />
          </div>
        </Field>

        <Field
          label="Instructions for Buyer & Owner"
          hint="Optional directions, parking notes, or documents to bring"
        >
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Call me 10 minutes before arrival at the main entrance..."
          />
        </Field>
      </form>
    </Sheet>
  );
}
