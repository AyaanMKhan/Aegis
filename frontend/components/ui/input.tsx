import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-control border border-line-strong bg-surface-2 px-3 text-sm text-fg " +
  "placeholder:text-fg-subtle transition-colors " +
  "hover:border-line-hover focus:border-fg-muted focus:outline-none " +
  "focus-visible:outline-none disabled:opacity-40";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-9", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(field, "min-h-20 py-2 leading-relaxed", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        field,
        "h-9 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%2399a1a7%22 stroke-width=%221.5%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    />
  );
}

/** Label + optional hint + error, wrapping any control. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[13px] font-medium text-fg"
      >
        {label}
        {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-failed">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
