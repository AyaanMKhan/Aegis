import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { DetailRow } from "@/components/ui/stat";
import { formatCpu, formatMemory } from "@/lib/format";
import type { Deployment } from "@/types/api";

/** A long AWS handle: mono, wrapping, with its own copy affordance. */
function Handle({ value }: { value: string }) {
  return (
    <span className="inline-flex items-start justify-end gap-2">
      <span className="min-w-0 break-all">{value}</span>
      <CopyButton value={value} className="mt-px shrink-0" />
    </span>
  );
}

/** Shown where an ARN does not exist yet because the apply is still running. */
function NotYet({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-sans text-[12px] text-pending">
      <span className="size-1.5 animate-pulse-dot rounded-full bg-pending" />
      {children}
    </span>
  );
}

/**
 * The AWS handles behind the row. This is the panel that proves a deployment is
 * a real ECS service behind a real ALB rule, not a database record.
 */
export function InfrastructurePanel({
  deployment,
  className,
}: {
  deployment: Deployment;
  className?: string;
}) {
  const { config } = deployment;

  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>Infrastructure</CardTitle>
          <p className="mt-1 text-[13px] text-fg-muted">
            The handles Aegis reconciles this row against in {deployment.region}.
          </p>
        </div>
      </CardHeader>
      <CardContent className="py-1">
        <dl>
          <DetailRow label="ECS service" mono>
            {deployment.ecsServiceName ? (
              <Handle value={deployment.ecsServiceName} />
            ) : (
              <NotYet>Created by the running apply</NotYet>
            )}
          </DetailRow>

          <DetailRow label="Target group" mono>
            {deployment.targetGroupArn ? (
              <Handle value={deployment.targetGroupArn} />
            ) : (
              <NotYet>Not created yet</NotYet>
            )}
          </DetailRow>

          <DetailRow label="ALB listener rule" mono>
            {deployment.albRuleArn ? (
              <Handle value={deployment.albRuleArn} />
            ) : (
              <NotYet>Not created yet</NotYet>
            )}
          </DetailRow>

          <DetailRow label="Terraform state key" mono>
            {deployment.tfStateKey ? (
              <Handle value={deployment.tfStateKey} />
            ) : (
              <NotYet>Assigned when the apply is queued</NotYet>
            )}
          </DetailRow>

          <DetailRow label="Container image" mono>
            <Handle value={config.containerImage} />
          </DetailRow>

          <DetailRow label="Task size">
            <span className="tnum">
              {formatCpu(config.cpu)} · {formatMemory(config.memory)}
            </span>
          </DetailRow>

          <DetailRow label="Desired count">
            <span className="tnum">
              {config.desiredCount} {config.desiredCount === 1 ? "task" : "tasks"}
            </span>
            <span className="ml-1.5 text-fg-subtle">
              (min {config.minCapacity} · max {config.maxCapacity})
            </span>
          </DetailRow>

          <DetailRow label="Health check">
            <span className="font-mono text-[12px]">{config.healthCheckPath}</span>
            <span className="ml-1.5 text-fg-subtle tnum">
              · {config.requestTimeoutSeconds}s timeout
            </span>
          </DetailRow>

          <DetailRow label="Region" mono>
            {deployment.region}
          </DetailRow>
        </dl>
      </CardContent>
    </Card>
  );
}
