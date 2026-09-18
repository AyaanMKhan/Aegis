import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { DeploymentEvent } from "@/types/api";

export const PHASE_LABELS: Record<DeploymentEvent["phase"], string> = {
  queued: "Queued",
  planning: "Planning",
  applying: "Applying",
  stabilising: "Stabilising",
  complete: "Complete",
  failed: "Failed",
};

/**
 * The terraform apply stream. The newest event is the one still running unless
 * the run reached a terminal phase, so it gets the spinner and everything above
 * it is checked off.
 */
export function EventTimeline({
  events,
  className,
}: {
  events: DeploymentEvent[];
  className?: string;
}) {
  // Newest first reads better here: the in-flight step is at the top.
  const ordered = [...events].reverse();
  const head = ordered[0];
  const terminal = head?.phase === "complete" || head?.phase === "failed";

  return (
    <ol className={cn("relative space-y-0", className)}>
      {ordered.map((event, i) => {
        const inFlight = i === 0 && !terminal;
        const failed = event.phase === "failed";
        return (
          <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector rail between the markers. */}
            {i < ordered.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[7px] top-5 h-full w-px bg-line"
              />
            )}

            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border",
                failed
                  ? "border-failed/40 bg-failed/15 text-failed"
                  : inFlight
                    ? "border-pending/40 bg-pending/15 text-pending"
                    : "border-live/30 bg-live/10 text-live",
              )}
            >
              {failed ? (
                <X className="size-2.5" />
              ) : inFlight ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : (
                <Check className="size-2.5" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wider",
                    failed
                      ? "text-failed"
                      : inFlight
                        ? "text-pending"
                        : "text-fg-subtle",
                  )}
                >
                  {PHASE_LABELS[event.phase]}
                </span>
                <span className="text-[11px] tnum text-fg-subtle">
                  {formatRelativeTime(event.createdAt, MOCK_NOW)}
                </span>
                {inFlight && (
                  <span className="text-[11px] text-pending">· in progress</span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1 font-mono text-[12px] leading-relaxed break-words",
                  inFlight ? "text-fg" : "text-fg-muted",
                )}
              >
                {event.message}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
