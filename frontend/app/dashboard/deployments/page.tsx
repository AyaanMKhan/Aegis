import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  DeploymentsTable,
  type DeploymentRow,
} from "@/components/deployments/deployments-table";
import { formatRelativeTime } from "@/lib/format";
import { MOCK_NOW, getMetrics, mockDeployments } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/types/api";

export const metadata: Metadata = {
  title: "Deployments",
  description:
    "Every ECS Fargate service Aegis has provisioned, with its endpoint, task count and recent traffic.",
};

/** The summary chips above the table, all derived from the fixtures. */
function summarise(statuses: DeploymentStatus[]) {
  const count = (...of: DeploymentStatus[]) =>
    statuses.filter((s) => of.includes(s)).length;
  return [
    { label: "Live", value: count("live"), dot: "bg-live" },
    {
      label: "Provisioning",
      value: count("provisioning", "updating", "pending"),
      dot: "bg-pending",
    },
    { label: "Degraded", value: count("degraded"), dot: "bg-pending" },
    { label: "Failed", value: count("failed", "stopped"), dot: "bg-failed" },
  ];
}

export default function DeploymentsPage() {
  const rows: DeploymentRow[] = mockDeployments.map((d) => {
    const metrics = getMetrics(d.id);
    const requests = metrics.requests.map((p) => p.value);
    return {
      id: d.id,
      name: d.name,
      projectId: d.projectId,
      projectName: d.projectName,
      modelRef: `${d.modelName}:v${d.modelVersion}`,
      status: d.status,
      region: d.region,
      desiredCount: d.config.desiredCount,
      endpointUrl: d.endpointUrl,
      lastDeployed: d.lastDeployedAt
        ? formatRelativeTime(d.lastDeployedAt, MOCK_NOW)
        : null,
      requests,
      requests48h: requests.reduce((a, b) => a + b, 0),
    };
  });

  const summary = summarise(mockDeployments.map((d) => d.status));
  const totalTasks = mockDeployments.reduce(
    (sum, d) => sum + d.config.desiredCount,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deployments"
        description="One ECS Fargate service per deployment, routed by path through the shared ALB. Each one is a real terraform apply against its own state key."
        actions={
          <ButtonLink href="/dashboard/deployments/new" variant="primary" size="sm">
            <Plus className="size-4" />
            New deployment
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-5">
        {summary.map((item) => (
          <div key={item.label} className="bg-surface px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  item.value > 0 ? item.dot : "bg-idle",
                )}
              />
              {item.label}
            </div>
            <div className="mt-1.5 text-lg font-semibold tnum text-fg">
              {item.value}
            </div>
          </div>
        ))}
        <div className="bg-surface px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
            Desired tasks
          </div>
          <div className="mt-1.5 text-lg font-semibold tnum text-fg">
            {totalTasks}
          </div>
        </div>
      </div>

      <DeploymentsTable rows={rows} />
    </div>
  );
}
