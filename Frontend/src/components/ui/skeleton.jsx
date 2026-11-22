import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-xl bg-muted/85 bg-[linear-gradient(110deg,transparent_25%,color-mix(in_oklab,var(--foreground)_6%,transparent)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}
