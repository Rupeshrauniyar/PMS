import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight leading-5 [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-foreground text-background",
        secondary: "border-border/80 bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        brand: "border-transparent bg-foreground text-background",
        success: "border-success/25 bg-success-soft text-success",
        warning: "border-border bg-secondary text-foreground",
        info: "border-border bg-secondary text-foreground",
        destructive: "border-destructive/25 bg-danger-soft text-destructive",
        muted: "border-transparent bg-muted text-muted-foreground",
        glass:
          "border-white/15 bg-black/65 text-white backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
