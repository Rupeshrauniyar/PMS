import * as React from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-7 text-[11px]",
  sm: "size-9 text-xs",
  default: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

function initialsOf(name) {
  if (!name) return "•";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = "default", className, alt }) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImg = Boolean(src) && !failed;

  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground font-semibold text-background ring-1 ring-border select-none",
        SIZES[size] || SIZES.default,
        className,
      )}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt ?? (name || "Avatar")}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
