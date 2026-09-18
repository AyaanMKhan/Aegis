import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Boxes, Rocket } from "lucide-react";
import { MOCK_NOW } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeploymentStatus, Project } from "@/types/api";

/** Serialisable shape the list page hands to the (client) grid. */
export interface ProjectCardData {
  project: Project;
  deploymentStatuses: DeploymentStatus[];
}

const dotClass: Record<DeploymentStatus, string> = {
  live: "bg-live",
  provisioning: "bg-pending",
  updating: "bg-pending",
  degraded: "bg-pending",
  pending: "bg-idle",
  stopped: "bg-idle",
  failed: "bg-failed",
};

const statusWord: Record<DeploymentStatus, string> = {
  live: "live",
  provisioning: "provisioning",
  updating: "updating",
  degraded: "degraded",
  pending: "queued",
  stopped: "stopped",
  failed: "failed",
};

/** "1 live · 1 provisioning", in the order the statuses first appear. */
function summarise(statuses: DeploymentStatus[]): string {
  const counts = new Map<DeploymentStatus, number>();
  for (const s of statuses) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .map(([status, n]) => `${n} ${statusWord[status]}`)
    .join(" · ");
}

export function ProjectCard({ project, deploymentStatuses }: ProjectCardData) {
  const settling = (s: DeploymentStatus) =>
    s === "provisioning" || s === "updating" || s === "live";
  const isEmpty = project.modelCount === 0;

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group flex flex-col rounded-card border border-line bg-surface p-5 raised transition-colors hover:border-line-strong hover:bg-surface-2/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium tracking-tight text-fg">
            {project.name}
          </h2>
          <p className="mt-0.5 truncate font-mono text-[11px] text-fg-subtle">
            {project.slug}
          </p>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg-muted" />
      </div>

      <p
        className={cn(
          "mt-3 line-clamp-2 min-h-[2.4rem] text-[13px] leading-relaxed",
          project.description ? "text-fg-muted" : "text-fg-subtle",
        )}
      >
        {project.description ?? "No description yet."}
      </p>

      <dl className="mt-4 flex items-center gap-4 border-t border-line pt-3.5 text-[12px] text-fg-muted">
        <div className="flex items-center gap-1.5">
          <Boxes className="size-3.5 text-fg-subtle" />
          <dt className="sr-only">Models</dt>
          <dd className="tnum">
            {project.modelCount}{" "}
            <span className="text-fg-subtle">
              {project.modelCount === 1 ? "model" : "models"}
            </span>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Rocket className="size-3.5 text-fg-subtle" />
          <dt className="sr-only">Deployments</dt>
          <dd className="tnum">
            {project.deploymentCount}{" "}
            <span className="text-fg-subtle">
              {project.deploymentCount === 1 ? "deployment" : "deployments"}
            </span>
          </dd>
        </div>
        <div className="ml-auto text-[11px] tnum text-fg-subtle">
          {formatRelativeTime(project.updatedAt, MOCK_NOW)}
        </div>
      </dl>

      <div className="mt-3 flex min-h-5 items-center gap-2 text-[12px]">
        {deploymentStatuses.length > 0 ? (
          <>
            <span className="flex items-center gap-1" aria-hidden>
              {deploymentStatuses.map((status, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    dotClass[status],
                    settling(status) && "animate-pulse-dot",
                  )}
                />
              ))}
            </span>
            <span className="text-fg-muted">
              {summarise(deploymentStatuses)}
            </span>
          </>
        ) : isEmpty ? (
          <span className="text-accent">Upload a model to get started</span>
        ) : (
          <span className="text-fg-subtle">No deployments yet</span>
        )}
      </div>
    </Link>
  );
}
