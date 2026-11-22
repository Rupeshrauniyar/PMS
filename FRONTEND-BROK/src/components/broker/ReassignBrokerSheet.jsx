import React, { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle2, Users } from "lucide-react";

import * as brokerApi from "@/api/broker";
import { useBrokers } from "@/hooks/useVisits";
import { getErrorMessage } from "@/lib/errors";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
      toast({ variant: "success", title: "Broker reassigned" });
      onReassigned?.(res.visit);
      onOpenChange?.(false);
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not reassign",
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
      title="Reassign Broker"
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
            onClick={handleConfirm}
            loading={submitting}
            disabled={!selectedId || selectedId === currentBrokerId}
          >
            Confirm
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brokers..."
            aria-label="Search brokers"
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={Users}
            title="Could not load brokers"
            action={
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No matching brokers" />
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border" role="radiogroup">
            {filtered.map((b) => {
              const isSelected = selectedId === b._id;
              return (
                <button
                  key={b._id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedId(b._id)}
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left transition-colors",
                    isSelected ? "bg-secondary/60" : "hover:bg-secondary/30",
                  )}
                >
                  <Avatar src={b.pp} name={b.username} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {b.username || "Broker"}
                      {currentBrokerId === b._id ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (current)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.assigned ?? 0} active · {b.email}
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="size-4 shrink-0 text-foreground" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
