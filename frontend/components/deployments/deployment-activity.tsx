import * as React from "react";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { EventTimeline } from "./event-timeline";
import type { Deployment, DeploymentEvent, LogLine } from "@/types/api";

const LEVEL_STYLES: Record<LogLine["level"], string> = {
  info: "text-fg-subtle",
  warn: "text-pending",
  error: "text-failed",
};

/**
 * One panel with three shapes: the live apply stream while Terraform is
 * running, the tail of the log stream when there is one, and a settled summary
 * when a healthy service simply has nothing to say.
 */
export function DeploymentActivity({
  deployment,
  events,
  logs,
}: {
  deployment: Deployment;
  events: DeploymentEvent[];
  logs: LogLine[];
}) {
  const root = `/dashboard/deployments/${deployment.id}`;

  if (events.length > 0) {
    return (
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Apply stream</CardTitle>
            <p className="mt-1 text-[13px] text-fg-muted">
              Streamed from the worker running{" "}
              <span className="font-mono text-[12px]">terraform apply</span>.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <EventTimeline events={events} />
        </CardContent>
      </Card>
    );
  }

  if (logs.length > 0) {
    return (
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Recent log lines</CardTitle>
            <p className="mt-1 text-[13px] text-fg-muted">
              Tail of the CloudWatch log group for{" "}
              <span className="font-mono text-[12px]">
                {deployment.ecsServiceName}
              </span>
              .
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <ul className="divide-y divide-line">
            {logs.map((line) => (
              <li
                key={line.id}
                className="flex gap-3 px-5 py-2.5 font-mono text-[12px] leading-relaxed"
              >
                <span className="shrink-0 tnum text-fg-subtle">
                  {formatRelativeTime(line.timestamp, MOCK_NOW)}
                </span>
                <span
                  className={cn(
                    "w-10 shrink-0 uppercase",
                    LEVEL_STYLES[line.level],
                  )}
                >
                  {line.level}
                </span>
                <span
                  className={cn(
                    "min-w-0 break-words",
                    line.level === "error" ? "text-fg" : "text-fg-muted",
                  )}
                >
                  {line.message}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-[11px] text-fg-subtle">
            Last {logs.length} lines · live tail on the Logs tab
          </span>
          <ButtonLink href={`${root}/logs`} variant="ghost" size="sm">
            Open logs
            <ArrowRight className="size-3.5" />
          </ButtonLink>
        </CardFooter>
      </Card>
    );
  }

  // No apply running and no log group to tail. Say what that does and does not
  // mean — on a degraded service, quiet infrastructure is not good news.
  const unhealthy =
    deployment.status === "degraded" || deployment.status === "failed";

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Activity</CardTitle>
          <p className="mt-1 text-[13px] text-fg-muted">
            Deploy events for this service.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2.5">
          {unhealthy ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-pending" />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-live" />
          )}
          <p className="text-[13px] leading-relaxed text-fg-muted">
            {unhealthy ? (
              <>
                No apply has run since the last deploy, so nothing changed in
                the infrastructure — ECS is holding the desired count and the
                target group still reports the tasks healthy. The degradation is
                in serving, which means the log stream is the next place to
                look.
              </>
            ) : (
              <>
                Nothing to report. No apply has run since the last deploy and
                the service has stayed inside its health check for the whole
                window.
              </>
            )}
          </p>
        </div>

        <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {[
            {
              label: "Last deploy",
              value: deployment.lastDeployedAt,
            },
            { label: "Last change detected", value: deployment.updatedAt },
            { label: "Created", value: deployment.createdAt },
          ].map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-[13px] tnum text-fg">
                {row.value ? (
                  formatRelativeTime(row.value, MOCK_NOW)
                ) : (
                  <span className="text-fg-subtle">Never</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter className="justify-end">
        <ButtonLink href={`${root}/logs`} variant="ghost" size="sm">
          Open logs
          <ArrowRight className="size-3.5" />
        </ButtonLink>
      </CardFooter>
    </Card>
  );
}
