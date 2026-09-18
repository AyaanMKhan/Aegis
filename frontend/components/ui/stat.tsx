import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A hero number, not a chart. The value leads; the sparkline (if any) is a
 * trend hint behind it. Delta direction is carried by an arrow + sign, never
 * by colour alone.
 */
export function Stat({
  label,
  value,
  unit,
  delta,
  /** true when a rising number is bad (error rate, latency, spend). */
  invertDelta = false,
  chart,
  footnote,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: number;
  invertDelta?: boolean;
  chart?: React.ReactNode;
  footnote?: string;
  className?: string;
}) {
  const rising = delta !== undefined && delta > 0;
  const good = delta === undefined ? null : invertDelta ? !rising : rising;

  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface px-4 py-3.5 raised",
        className,
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight tnum text-fg">
          {value}
        </span>
        {unit && <span className="text-sm text-fg-muted">{unit}</span>}
        {delta !== undefined && delta !== 0 && (
          <span
            className={cn(
              "ml-1 inline-flex items-center gap-0.5 text-xs font-medium tnum",
              good ? "text-live" : "text-failed",
            )}
          >
            {rising ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
      </div>
      {chart && <div className="mt-3">{chart}</div>}
      {footnote && <p className="mt-2 text-[11px] text-fg-subtle">{footnote}</p>}
    </div>
  );
}

/** Label/value row used on overview panels and config summaries. */
export function DetailRow({
  label,
  children,
  mono,
  className,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-6 border-b border-line py-2.5 last:border-0",
        className,
      )}
    >
      <dt className="shrink-0 text-[13px] text-fg-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right text-[13px] text-fg",
          mono && "font-mono text-[12px] break-all",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
