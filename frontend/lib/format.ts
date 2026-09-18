/** Display formatters. Everything user-facing that isn't a raw string. */

export function formatBytes(bytes: number, precision = 1): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : precision)} ${units[i]}`;
}

export function formatNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const seconds = Math.round((now.getTime() - then) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

/**
 * Locale and time zone are both pinned.
 *
 * Without them these run under the server's zone during SSR and the viewer's
 * zone on hydration, so a timestamp near midnight renders two different
 * strings and React reports a hydration mismatch. UTC is the right anchor
 * here because every timestamp the control plane returns is UTC.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function formatLatency(ms: number): string {
  return ms < 1 ? "<1 ms" : `${Math.round(ms)} ms`;
}

export function formatPercent(fraction: number, precision = 2): string {
  return `${(fraction * 100).toFixed(precision)}%`;
}

/** Fargate task CPU units -> vCPU label. */
export function formatCpu(units: number): string {
  return `${units / 1024} vCPU`;
}

/** Task memory MiB -> GB label. */
export function formatMemory(mib: number): string {
  return mib < 1024 ? `${mib} MiB` : `${mib / 1024} GB`;
}

/** [null, 3, 224, 224] -> "[batch, 3, 224, 224]" */
export function formatShape(shape: (number | null)[]): string {
  return `[${shape.map((d) => (d === null ? "batch" : d)).join(", ")}]`;
}
