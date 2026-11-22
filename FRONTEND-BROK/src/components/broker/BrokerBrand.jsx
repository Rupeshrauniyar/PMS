import React from "react";
import { ShieldCheck, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RoleBadge({ role, className }) {
  const isSuper = role === "superbroker";
  return (
    <Badge
      variant={isSuper ? "default" : "secondary"}
      className={cn("gap-1 tracking-tight", className)}
    >
      {isSuper ? (
        <ShieldCheck className="size-3" aria-hidden="true" />
      ) : (
        <Briefcase className="size-3" aria-hidden="true" />
      )}
      <span>{isSuper ? "Superbroker" : "Broker"}</span>
    </Badge>
  );
}

export function BrokerBrand({ compact = false, className }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="size-8 shrink-0 text-foreground"
      >
        <rect width="28" height="28" rx="8" fill="currentColor" />
        <path
          d="M8.5 20V11.2L14 7.5L19.5 11.2V20H15.8V15.2H12.2V20H8.5Z"
          fill="var(--background)"
        />
      </svg>
      {!compact ? (
        <div className="min-w-0 leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[15.5px] font-extrabold tracking-[-0.03em] text-foreground">
              Propatyc
            </span>
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-background">
              Broker
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            Visit Console
          </p>
        </div>
      ) : null}
    </div>
  );
}
