import * as React from "react";
import { cn } from "@/lib/utils";
import type { MetricPoint } from "@/types/api";

/* Shared geometry helpers -------------------------------------------------- */

function extent(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would collapse to a zero-height path; give it room.
  return max === min ? [min - 1, max + 1] : [min, max];
}

function toPath(
  values: number[],
  width: number,
  height: number,
  pad: number,
): { line: string; area: string; points: [number, number][] } {
  const [lo, hi] = extent(values);
  const innerH = height - pad * 2;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i): [number, number] => [
    i * step,
    pad + innerH - ((v - lo) / (hi - lo)) * innerH,
  ]);
  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area, points };
}

/* Sparkline ---------------------------------------------------------------- */

/**
 * Trend-only mark for a stat tile: no axes, no grid, no tooltip. The value it
 * annotates is always printed beside it, so the shape is never load-bearing.
 */
export function Sparkline({
  data,
  className,
  stroke = "var(--color-accent)",
  fill = true,
  width = 120,
  height = 32,
  label,
}: {
  data: MetricPoint[] | number[];
  className?: string;
  stroke?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  /** Screen-reader description; the visible number carries the real meaning. */
  label?: string;
}) {
  const values = data.map((d) => (typeof d === "number" ? d : d.value));
  if (values.length === 0) return null;
  const { line, area } = toPath(values, width, height, 3);
  const gradientId = React.useId();

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-full overflow-visible", className)}
      preserveAspectRatio="none"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* Area chart --------------------------------------------------------------- */

/**
 * Single-series area chart with a recessive grid and y-axis labels.
 * One series, so no legend box — the card title names what is plotted.
 */
export function AreaChart({
  data,
  className,
  stroke = "var(--color-accent)",
  height = 180,
  valueFormat = (v: number) => String(Math.round(v)),
  xLabels,
  title,
}: {
  data: MetricPoint[];
  className?: string;
  stroke?: string;
  height?: number;
  valueFormat?: (v: number) => string;
  xLabels?: [string, string];
  title?: string;
}) {
  const values = data.map((d) => d.value);
  if (values.length === 0) return null;

  const width = 600;
  const pad = 6;
  const { line, area } = toPath(values, width, height, pad);
  const [lo, hi] = extent(values);
  const gradientId = React.useId();
  const ticks = [hi, lo + (hi - lo) / 2, lo];

  return (
    <div className={cn("flex gap-3", className)}>
      {/* y-axis: three ticks is enough to read the scale. */}
      <div
        className="flex shrink-0 flex-col justify-between py-0.5 text-[10px] tnum text-fg-subtle"
        style={{ height }}
        aria-hidden
      >
        {ticks.map((t, i) => (
          <span key={i}>{valueFormat(t)}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="none"
          role="img"
          aria-label={title ?? "Time series chart"}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid sits behind the mark and stays recessive. */}
          {[0, 0.5, 1].map((f) => (
            <line
              key={f}
              x1="0"
              x2={width}
              y1={pad + f * (height - pad * 2)}
              y2={pad + f * (height - pad * 2)}
              stroke="var(--color-line)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {xLabels && (
          <div className="mt-2 flex justify-between text-[10px] text-fg-subtle">
            <span>{xLabels[0]}</span>
            <span>{xLabels[1]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Bar chart ---------------------------------------------------------------- */

/** Single-series bars with 4px rounded data-ends anchored to the baseline. */
export function BarChart({
  data,
  className,
  fill = "var(--color-accent)",
  height = 140,
}: {
  data: MetricPoint[];
  className?: string;
  fill?: string;
  height?: number;
}) {
  const values = data.map((d) => d.value);
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);

  return (
    <div
      className={cn("flex items-end gap-[2px]", className)}
      style={{ height }}
      role="img"
      aria-label="Bar chart"
    >
      {values.map((v, i) => (
        <div
          key={i}
          className="min-w-0 flex-1 rounded-t-[4px] transition-opacity hover:opacity-80"
          style={{
            height: `${Math.max((v / max) * 100, 1.5)}%`,
            backgroundColor: fill,
          }}
        />
      ))}
    </div>
  );
}
