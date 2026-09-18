import * as React from "react";
import { cn } from "@/lib/utils";
import type { DeploymentStatus, ModelVersionStatus } from "@/types/api";

type Tone = "neutral" | "accent" | "live" | "pending" | "failed" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong bg-surface-2 text-fg-muted",
  accent: "border-accent/25 bg-accent/10 text-accent",
  live: "border-live/25 bg-live/10 text-live",
  pending: "border-pending/25 bg-pending/10 text-pending",
  failed: "border-failed/25 bg-failed/10 text-failed",
  info: "border-info/25 bg-info/10 text-info",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const deploymentTone: Record<DeploymentStatus, { tone: Tone; label: string }> = {
  live: { tone: "live", label: "Live" },
  provisioning: { tone: "pending", label: "Provisioning" },
  updating: { tone: "pending", label: "Updating" },
  pending: { tone: "neutral", label: "Queued" },
  degraded: { tone: "pending", label: "Degraded" },
  failed: { tone: "failed", label: "Failed" },
  stopped: { tone: "neutral", label: "Stopped" },
};

const dotColor: Record<Tone, string> = {
  neutral: "bg-idle",
  accent: "bg-accent",
  live: "bg-live",
  pending: "bg-pending",
  failed: "bg-failed",
  info: "bg-info",
};

/** Status pill with a dot; the dot pulses while the state is still settling. */
export function StatusBadge({
  status,
  className,
}: {
  status: DeploymentStatus;
  className?: string;
}) {
  const { tone, label } = deploymentTone[status];
  const settling = status === "provisioning" || status === "updating";
  return (
    <Badge tone={tone} className={className}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          dotColor[tone],
          (settling || status === "live") && "animate-pulse-dot",
        )}
      />
      {label}
    </Badge>
  );
}

const versionTone: Record<ModelVersionStatus, { tone: Tone; label: string }> = {
  ready: { tone: "live", label: "Ready" },
  uploading: { tone: "pending", label: "Uploading" },
  inspecting: { tone: "pending", label: "Inspecting" },
  failed: { tone: "failed", label: "Failed" },
};

export function ModelStatusBadge({
  status,
  className,
}: {
  status: ModelVersionStatus;
  className?: string;
}) {
  const { tone, label } = versionTone[status];
  return (
    <Badge tone={tone} className={className}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          dotColor[tone],
          status !== "ready" && status !== "failed" && "animate-pulse-dot",
        )}
      />
      {label}
    </Badge>
  );
}
