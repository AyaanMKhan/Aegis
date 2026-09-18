import * as React from "react";
import Link from "next/link";
import { MOCK_NOW } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import type { Deployment } from "@/types/api";

export function ProjectDeploymentsTable({
  deployments,
}: {
  deployments: Deployment[];
}) {
  return (
    <Table>
      <THead>
        <tr>
          <TH>Deployment</TH>
          <TH className="w-36">Status</TH>
          <TH>Endpoint</TH>
          <TH className="hidden w-44 md:table-cell">Model</TH>
          <TH className="hidden w-32 text-right sm:table-cell">
            Last deployed
          </TH>
        </tr>
      </THead>
      <tbody>
        {deployments.map((deployment) => (
          <TR key={deployment.id} className="relative">
            <TD className="max-w-[14rem]">
              <Link
                href={`/dashboard/deployments/${deployment.id}`}
                className="block truncate text-[13px] font-medium text-fg after:absolute after:inset-0 after:content-['']"
              >
                {deployment.name}
              </Link>
              <p className="mt-1 font-mono text-[11px] text-fg-subtle">
                {deployment.config.desiredCount}× {deployment.config.cpu / 1024}{" "}
                vCPU · {deployment.region}
              </p>
            </TD>

            <TD>
              <StatusBadge status={deployment.status} />
            </TD>

            <TD>
              {deployment.endpointUrl ? (
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-[12px] text-fg-muted">
                    {deployment.endpointUrl}
                  </span>
                  <span className="relative z-10 shrink-0">
                    <CopyButton value={deployment.endpointUrl} />
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-pending">
                  <span className="size-1.5 rounded-full bg-pending animate-pulse-dot" />
                  ALB rule pending
                </span>
              )}
            </TD>

            <TD className="hidden max-w-[11rem] truncate font-mono text-[12px] md:table-cell">
              {deployment.modelName}:{deployment.modelVersion}
            </TD>

            <TD className="hidden text-right text-[11px] tnum text-fg-subtle sm:table-cell">
              {deployment.lastDeployedAt
                ? formatRelativeTime(deployment.lastDeployedAt, MOCK_NOW)
                : "never"}
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
