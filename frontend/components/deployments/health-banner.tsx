import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatLatency, formatPercent, formatRelativeTime } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock-data";
import type { Deployment, DeploymentMetrics } from "@/types/api";

/**
 * The degraded banner. It names the two numbers that actually tripped the
 * status and what about the task sizing explains them — a generic "something is
 * wrong" alert would be useless on a page that already shows the status pill.
 */
export function HealthBanner({
  deployment,
  metrics,
}: {
  deployment: Deployment;
  metrics: DeploymentMetrics;
}) {
  if (deployment.status !== "degraded" && deployment.status !== "failed") {
    return null;
  }

  const { config } = deployment;
  const tailRatio = metrics.p50LatencyMs
    ? metrics.p95LatencyMs / metrics.p50LatencyMs
    : 0;

  const findings: string[] = [];

  if (metrics.errorRate > 0.01) {
    findings.push(
      `${formatPercent(metrics.errorRate)} of requests failed over the last 48 hours — roughly 1 in ${Math.round(
        1 / metrics.errorRate,
      )}.`,
    );
  }

  if (tailRatio >= 3) {
    findings.push(
      `p95 latency is ${formatLatency(metrics.p95LatencyMs)} against a p50 of ${formatLatency(
        metrics.p50LatencyMs,
      )} — a ${tailRatio.toFixed(1)}× tail, the shape of requests queueing rather than computing.`,
    );
  }

  if (config.desiredCount === 1) {
    findings.push(
      `The service runs a single task at ${config.cpu / 1024} vCPU. Autoscaling policies land in phase 5, so the recorded max capacity of ${config.maxCapacity} is not enforced and nothing scales out under load.`,
    );
  }

  return (
    <div className="rounded-card border border-pending/25 bg-pending/[0.06] px-4 py-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-pending" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-pending">
            Serving degraded since{" "}
            <span className="tnum">
              {formatRelativeTime(deployment.updatedAt, MOCK_NOW)}
            </span>
          </h2>
          <ul className="mt-2 space-y-1.5">
            {findings.map((finding) => (
              <li
                key={finding}
                className="flex gap-2 text-[13px] leading-relaxed text-fg-muted"
              >
                <span aria-hidden className="text-pending/60">
                  —
                </span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink
            href={`/dashboard/deployments/${deployment.id}/logs`}
            variant="ghost"
            size="sm"
          >
            Open logs
          </ButtonLink>
          <ButtonLink
            href={`/dashboard/deployments/${deployment.id}/configure`}
            variant="secondary"
            size="sm"
          >
            Raise task size
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
