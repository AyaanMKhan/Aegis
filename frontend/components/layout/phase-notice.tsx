import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Honest placeholder for a route whose backend lands in a later phase.
 * It states which phase owns the work rather than faking a working screen.
 */
export function PhaseNotice({
  icon: Icon,
  title,
  phase,
  description,
  bullets,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  phase: string;
  description: string;
  bullets?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid-bg rounded-card border border-dashed border-line-strong px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2">
          <Icon className="size-5 text-fg-subtle" />
        </div>
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-fg-muted">
          <span className="size-1.5 rounded-full bg-pending" />
          {phase}
        </span>
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
          {description}
        </p>
        {bullets && (
          <ul className="mt-5 w-full space-y-2 text-left">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-2.5 rounded-control border border-line bg-surface px-3 py-2 text-[12.5px] text-fg-muted"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-fg-subtle" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
