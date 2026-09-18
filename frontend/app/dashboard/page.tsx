import type { Metadata } from "next";
import { Plus, Upload } from "lucide-react";
import {
  MOCK_NOW,
  getMetrics,
  mockDashboardSummary,
  mockDeployments,
  mockProjects,
  mockUser,
} from "@/lib/mock-data";
import { formatLatency, formatNumber, formatPercent } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AreaChart, Sparkline } from "@/components/ui/chart";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DeploymentsPanel } from "@/components/dashboard/deployments-panel";
import type { MetricPoint } from "@/types/api";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Live deployments, request volume and recent activity across your Aegis projects.",
};

/** Derived from the frozen clock, so server and client agree. */
function greeting(): string {
  const hour = MOCK_NOW.getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Hourly request totals across every deployment; the series share a time base. */
function platformTraffic(): MetricPoint[] {
  const all = mockDeployments.map((d) => getMetrics(d.id).requests);
  const base = all[0] ?? [];
  return base.map((point, i) => ({
    t: point.t,
    value: all.reduce((sum, s) => sum + (s[i]?.value ?? 0), 0),
  }));
}

export default function DashboardPage() {
  const summary = mockDashboardSummary;
  const traffic = platformTraffic();
  const peak = Math.max(...traffic.map((p) => p.value));

  const provisioning = mockDeployments.filter(
    (d) => d.status === "provisioning" || d.status === "updating",
  ).length;
  const unhealthy = mockDeployments.filter(
    (d) => d.status === "degraded" || d.status === "failed",
  ).length;

  const resnetRequests = getMetrics("dep_resnet_prod").requests;
  const slowest = [...mockDeployments].sort(
    (a, b) => getMetrics(b.id).p95LatencyMs - getMetrics(a.id).p95LatencyMs,
  )[0];
  const recentProject = [...mockProjects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];

  const subtitle = [
    `${summary.liveDeployments} of ${summary.totalDeployments} deployments live across ${mockProjects.length} projects.`,
    provisioning > 0
      ? `${provisioning} apply in flight.`
      : "No applies running.",
    unhealthy > 0 ? `${unhealthy} needs attention.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${mockUser.name.split(" ")[0]}`}
        description={subtitle}
        actions={
          <>
            <ButtonLink
              href={`/dashboard/projects/${recentProject.id}/models/new`}
              variant="secondary"
              size="sm"
            >
              <Upload />
              Upload model
            </ButtonLink>
            <ButtonLink href="/dashboard/projects/new" size="sm">
              <Plus />
              New project
            </ButtonLink>
          </>
        }
      />

      {/* ------------------------------------------------------------- KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Live deployments"
          value={summary.liveDeployments}
          unit={`of ${summary.totalDeployments}`}
          footnote={
            [
              provisioning > 0 ? `${provisioning} provisioning` : null,
              unhealthy > 0 ? `${unhealthy} degraded` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "All services healthy"
          }
        />
        <Stat
          label="Requests · 24h"
          value={formatNumber(summary.requests24h)}
          delta={summary.requests24hDelta}
          chart={
            <Sparkline
              data={resnetRequests}
              label="Hourly requests to resnet50-prod over the last 48 hours"
            />
          }
          footnote="Trend line: resnet50-prod, last 48h"
        />
        <Stat
          label="p95 latency"
          value={summary.p95LatencyMs}
          unit="ms"
          delta={summary.p95LatencyDelta}
          invertDelta
          footnote={
            slowest
              ? `Slowest: ${slowest.name} at ${formatLatency(
                  getMetrics(slowest.id).p95LatencyMs,
                )}`
              : undefined
          }
        />
        <Stat
          label="Error rate"
          value={formatPercent(summary.errorRate, 2)}
          delta={summary.errorRateDelta}
          invertDelta
          footnote="keyword-spotter accounts for most failures"
        />
      </div>

      {/* --------------------------------------------- traffic + activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Requests across all deployments</CardTitle>
              <CardDescription>
                Hourly totals from the gateway, last 48 hours.
              </CardDescription>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11px] uppercase tracking-wider text-fg-subtle">
                Peak
              </div>
              <div className="text-[13px] tnum text-fg">
                {formatNumber(peak)}
                <span className="text-fg-muted"> /hr</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={traffic}
              title="Requests per hour across all deployments"
              valueFormat={(v) => formatNumber(Math.round(v))}
              xLabels={["48h ago", "now"]}
            />
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>

      {/* ------------------------------------------------------ deployments */}
      <DeploymentsPanel />
    </div>
  );
}
