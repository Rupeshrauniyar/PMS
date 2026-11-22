import React, { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, CheckCircle2, Users } from "lucide-react";

import * as brokerApi from "@/api/broker";
import { useBrokers } from "@/hooks/useVisits";
import { getErrorMessage } from "@/lib/errors";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Superbroker-exclusive Sheet to assign/reassign a visit to any registered broker.
 */
export function ReassignBrokerSheet({
  open,
  onOpenChange,
  visit,
  onReassigned,
}) {
  const { toast } = useToast();
  const { brokers, loading, error, refetch } = useBrokers({ enabled: open });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentBrokerId = visit?.broker?._id || null;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedId(currentBrokerId);
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentBrokerId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brokers;
    return brokers.filter(
      (b) =>
        b.username?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q),
    );
  }, [brokers, query]);

  const handleConfirm = async () => {
    if (!visit?._id || !selectedId || selectedId === currentBrokerId || submitting) return;
    setSubmitting(true);
    try {
      const res = await brokerApi.reassignVisit(visit._id, selectedId);
      const target = brokers.find((b) => b._id === selectedId);
      toast({
        variant: "success",
        title: "Visit reassigned",
        description: target?.username
          ? `Assigned to ${target.username}. All parties notified.`
          : "Broker assignment updated.",
      });
      onReassigned?.(res.visit);
      onOpenChange?.(false);
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't reassign broker",
        description: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!submitting) onOpenChange?.(v);
      }}
      dismissible={!submitting}
      title="Reassign Visit Broker"
      description="Superbroker override — transfer ownership of this visit to another Propatyc broker."
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
            onClick={handleConfirm}
            loading={submitting}
            disabled={!selectedId || selectedId === currentBrokerId}
          >
            Confirm Assignment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter brokers by name, email, or phone..."
            aria-label="Filter brokers"
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-18 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={Users}
            title="Couldn't load brokers"
            description={error.message}
            action={
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No matching brokers"
            description="Try clearing your search query."
          />
        ) : (
          <div className="space-y-2" role="radiogroup" aria-label="Select a broker">
            {filtered.map((b) => {
              const isSelected = selectedId === b._id;
              const isCurrent = currentBrokerId === b._id;
              return (
                <button
                  key={b._id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedId(b._id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isSelected
                      ? "border-brand bg-brand-soft/45 shadow-soft"
                      : "border-border/75 bg-card hover:bg-accent/60",
                  )}
                >
                  <Avatar src={b.pp} name={b.username} size="default" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-foreground">
                        {b.username || "Broker"}
                      </span>
                      {b.role === "superbroker" ? (
                        <Badge variant="brand" className="px-2 py-0 text-[10px]">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          Superbroker
                        </Badge>
                      ) : null}
                      {isCurrent ? (
                        <Badge variant="muted" className="px-2 py-0 text-[10px]">
                          Current
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {b.email}
                      {b.phone ? ` · ${b.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[11px]">
                      {b.assigned ?? 0} active
                    </Badge>
                    {isSelected ? (
                      <CheckCircle2 className="size-4 text-brand" aria-hidden="true" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
