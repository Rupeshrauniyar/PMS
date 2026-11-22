import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-xl border border-input bg-card text-foreground text-[15px] shadow-[0_1px_0_oklch(0_0_0/0.02)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/15";

/** Text input. Accepts every native `<input>` prop. */
const Input = React.forwardRef(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        "h-11 px-3.5",
        "file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
});

/** Multi-line text input. Grows with content where `field-sizing` is supported. */
const Textarea = React.forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      data-slot="textarea"
      className={cn(
        fieldBase,
        "min-h-24 px-3.5 py-3 leading-relaxed resize-y [field-sizing:content] max-h-[50vh]",
        className,
      )}
      {...props}
    />
  );
});

/** Native `<select>` styled to match. Pass `<option>` children. */
const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        data-slot="select"
        className={cn(fieldBase, "h-11 appearance-none pl-3.5 pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
});

function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-[13px] font-semibold text-foreground/90 leading-none select-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Field: label + control + hint/error, wired up with ids and aria attributes.
 * The single child element receives `id`, `aria-describedby` and `aria-invalid`.
 */
function Field({ label, hint, error, children, className, required, id: idProp }) {
  const autoId = React.useId();
  const id = idProp || `f-${autoId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        required: children.props.required ?? required,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-2", className)} data-slot="field">
      {label ? (
        <Label htmlFor={React.isValidElement(children) ? children.props.id || id : undefined}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      ) : null}
      {child}
      {error ? (
        <p id={errorId} className="text-[13px] font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Input, Textarea, Select, Label, Field };
