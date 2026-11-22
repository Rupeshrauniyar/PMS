import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className,
}) {
  const renderedIcon = React.isValidElement(Icon) ? (
    Icon
  ) : typeof Icon === "function" || typeof Icon === "object" ? (
    <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
  ) : null;

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      {renderedIcon ? (
        <div className="mb-4 flex size-13 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/60">
          {renderedIcon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
