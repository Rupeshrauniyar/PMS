import React from "react";
import { ShieldCheck, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RoleBadge({ role, className }) {
  const isSuper = role === "superbroker";
  return (
    <Badge
      variant={isSuper ? "brand" : "info"}
      className={cn("gap-1 tracking-tight", className)}
    >
      {isSuper ? (
        <ShieldCheck className="size-3.5" aria-hidden="true" />
      ) : (
        <Briefcase className="size-3.5" aria-hidden="true" />
      )}
      <span>{isSuper ? "Superbroker" : "Broker"}</span>
    </Badge>
  );
}

export function BrokerBrand({ compact = false, className }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-soft ring-1 ring-border/60">
        <img
          src="/web-app-manifest-192x192.png"
          alt="Propatyc Broker logo"
          width={36}
          height={36}
          className="size-7 object-contain"
        />
      </div>
      {!compact ? (
        <div className="min-w-0 leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-extrabold tracking-tight text-foreground">
              Propatyc
            </span>
            <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-foreground">
              Broker
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            Site Visit Console
          </p>
        </div>
      ) : null}
    </div>
  );
}
