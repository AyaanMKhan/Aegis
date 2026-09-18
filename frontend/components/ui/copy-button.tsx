"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Copies `value` and flips to a check for 1.6s. */
export function CopyButton({
  value,
  className,
  label,
  srLabel,
}: {
  value: string;
  className?: string;
  /** Visible text beside the icon. Omit for an icon-only button. */
  label?: string;
  /** Names what is being copied for screen readers, e.g. "Copy endpoint URL".
   *  Worth setting on every icon-only button, where `label` can't do the job. */
  srLabel?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={srLabel ?? label ?? "Copy to clipboard"}
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface-2 px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-accent" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
