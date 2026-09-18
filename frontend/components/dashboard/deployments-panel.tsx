import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MOCK_NOW, getMetrics, mockDeployments } from "@/lib/mock-data";
import { formatPercent, formatRelativeTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Deployment } from "@/types/api";

/** The right-hand timestamp column; a deployment mid-apply has nothing to show. */
function timing(deployment: Deployment): string {
  if (deployment.lastDeployedAt) {
    return formatRelativeTime(deployment.lastDeployedAt, MOCK_NOW);
  }
  if (deployment.status === "provisioning" || deployment.status === "pending") {
    return `started ${formatRelativeTime(deployment.createdAt, MOCK_NOW)}`;
  }
  return "never deployed";
}

/** A one-line explanation for any state that is not simply healthy. */
function note(deployment: Deployment): { text: string; tone: string } | null {
  if (deployment.status === "provisioning") {
    return {
      text: "terraform apply in progress — ALB rule not created yet",
      tone: "text-pending",
    };
  }
  if (deployment.status === "degraded") {
    const { errorRate } = getMetrics(deployment.id);
    return {
      text: `${formatPercent(errorRate, 1)} of requests failing — tasks flapping`,
      tone: "text-pending",
    };
  }
  if (deployment.status === "failed") {
    return { text: "last apply failed", tone: "text-failed" };
  }
  return null;
}

export function DeploymentsPanel({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Deployments</CardTitle>
          <p className="mt-1 text-[13px] text-fg-muted">
            One ECS Fargate service each, routed by path off the shared ALB.
          </p>
        </div>
        <ButtonLink href="/dashboard/deployments" variant="secondary" size="sm">
          View all
        </ButtonLink>
      </CardHeader>

      <CardContent className="px-0 py-0">
        <ul className="divide-y divide-line">
          {mockDeployments.map((deployment) => {
            const detail = note(deployment);
            return (
              <li key={deployment.id}>
                <Link
                  href={`/dashboard/deployments/${deployment.id}`}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-fg">
                      {deployment.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-fg-subtle">
                      <span className="truncate">{deployment.projectName}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate font-mono">
                        {deployment.modelName}:{deployment.modelVersion}
                      </span>
                    </div>
                    {detail && (
                      <p className={cn("mt-1 text-[11px]", detail.tone)}>
                        {detail.text}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={deployment.status} />
                    <span className="hidden w-28 text-right text-[11px] tnum text-fg-subtle sm:block">
                      {timing(deployment)}
                    </span>
                    <ChevronRight className="size-4 text-fg-subtle transition-colors group-hover:text-fg-muted" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
