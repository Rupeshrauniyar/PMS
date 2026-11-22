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
    <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
  ) : null;

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className,
      )}
    >
      {renderedIcon ? (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-secondary">
          {renderedIcon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}
