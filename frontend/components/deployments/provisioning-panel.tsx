import * as React from "react";
import { Activity, Globe, Network, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCpu, formatMemory, formatRelativeTime } from "@/lib/format";
import { BASE_DOMAIN, MOCK_NOW } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Deployment, DeploymentEvent } from "@/types/api";

/** The apply pipeline, in the order the worker walks it. */
const STEPS: { phase: DeploymentEvent["phase"]; label: string; detail: string }[] = [
  { phase: "queued", label: "Queued", detail: "Waiting for the state lock" },
  { phase: "planning", label: "Plan", detail: "terraform init + plan" },
  { phase: "applying", label: "Apply", detail: "Creating AWS resources" },
  {
    phase: "stabilising",
    label: "Stabilise",
    detail: "Target group health checks",
  },
  { phase: "complete", label: "Live", detail: "ALB rule routing traffic" },
];

/**
 * Stands in for the KPI row and traffic chart while a deployment has no
 * endpoint and no requests yet. Driven entirely by the event stream.
 */
export function ProvisioningPanel({
  deployment,
  events,
}: {
  deployment: Deployment;
  events: DeploymentEvent[];
}) {
  const latest = events[events.length - 1];
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.phase === (latest?.phase ?? "queued")),
  );
  const failed = latest?.phase === "failed";
  // Halfway through the active step reads as "working", not "finished".
  const progress = ((currentIndex + 0.5) / STEPS.length) * 100;

  const predictedEndpoint = `https://${BASE_DOMAIN}/d/${deployment.slug}`;

  const pending = [
    {
      icon: Globe,
      title: "HTTPS endpoint",
      body: predictedEndpoint,
      mono: true,
    },
    {
      icon: Network,
      title: "Target group + listener rule",
      body: `A path rule for /d/${deployment.slug} on the shared ALB.`,
      mono: false,
    },
    {
      icon: Activity,
      title: `${deployment.config.desiredCount} Fargate ${
        deployment.config.desiredCount === 1 ? "task" : "tasks"
      }`,
      body: `${formatCpu(deployment.config.cpu)} · ${formatMemory(
        deployment.config.memory,
      )}, pulling the model from S3 at boot.`,
      mono: false,
    },
    {
      icon: ScrollText,
      title: "Metrics and logs",
      body: "Request volume, latency and CloudWatch log lines begin on the first healthy task.",
      mono: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 rounded-full",
                failed ? "bg-failed" : "animate-pulse-dot bg-pending",
              )}
            />
            {failed ? "Apply failed" : "terraform apply in flight"}
          </CardTitle>
          <p className="mt-1 text-[13px] text-fg-muted">
            No endpoint and no metrics until the ALB rule exists. Started{" "}
            {formatRelativeTime(deployment.createdAt, MOCK_NOW)} against{" "}
            <span className="font-mono text-[12px]">
              {deployment.tfStateKey ?? "an unassigned state key"}
            </span>
            .
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stepper --------------------------------------------------------- */}
        <div>
          <ol className="flex flex-wrap gap-x-6 gap-y-3">
            {STEPS.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <li key={step.phase} className="min-w-0">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider",
                      active
                        ? failed
                          ? "text-failed"
                          : "text-pending"
                        : done
                          ? "text-live"
                          : "text-fg-subtle",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        active
                          ? cn(
                              failed ? "bg-failed" : "bg-pending",
                              !failed && "animate-pulse-dot",
                            )
                          : done
                            ? "bg-live"
                            : "bg-idle/50",
                      )}
                    />
                    {step.label}
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-[11px]",
                      active ? "text-fg-muted" : "text-fg-subtle",
                    )}
                  >
                    {step.detail}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                failed ? "bg-failed" : "bg-accent",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {latest && (
            <p className="mt-2.5 font-mono text-[12px] leading-relaxed text-fg">
              {latest.message}
              <span className="ml-2 tnum text-fg-subtle">
                {formatRelativeTime(latest.createdAt, MOCK_NOW)}
              </span>
            </p>
          )}
        </div>

        {/* What lands when it finishes ------------------------------------- */}
        <div className="border-t border-line pt-4">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
            When this apply completes
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {pending.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-2.5 rounded-control border border-line bg-surface-2/50 px-3 py-2.5"
                >
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-fg">{item.title}</div>
                    <p
                      className={cn(
                        "mt-0.5 text-[12px] leading-relaxed text-fg-muted",
                        item.mono && "font-mono break-all",
                      )}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
