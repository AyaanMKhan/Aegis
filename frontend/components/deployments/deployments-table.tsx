"use client";

import * as React from "react";
import Link from "next/link";
import { Rocket, Search, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkline } from "@/components/ui/chart";
import { Input, Select } from "@/components/ui/input";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/types/api";

/** Pre-flattened on the server so no Date work happens during render here. */
export interface DeploymentRow {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  modelRef: string;
  status: DeploymentStatus;
  region: string;
  desiredCount: number;
  endpointUrl: string | null;
  /** Already run through formatRelativeTime(iso, MOCK_NOW). */
  lastDeployed: string | null;
  /** 48 hourly request counts driving the trailing sparkline. */
  requests: number[];
  requests48h: number;
}

const STATUS_LABELS: Record<DeploymentStatus, string> = {
  live: "Live",
  provisioning: "Provisioning",
  updating: "Updating",
  pending: "Queued",
  degraded: "Degraded",
  failed: "Failed",
  stopped: "Stopped",
};

export function DeploymentsTable({ rows }: { rows: DeploymentRow[] }) {
  const [status, setStatus] = React.useState<"all" | DeploymentStatus>("all");
  const [query, setQuery] = React.useState("");

  // Only offer statuses that actually occur in the data.
  const statuses = React.useMemo(() => {
    const seen = new Set<DeploymentStatus>();
    for (const row of rows) seen.add(row.status);
    return [...seen];
  }, [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      return [row.name, row.projectName, row.modelRef, row.endpointUrl ?? "", row.region]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, status, query]);

  const filtering = status !== "all" || query.trim() !== "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, project, model…"
            aria-label="Filter deployments"
            className="pl-8"
          />
        </div>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | DeploymentStatus)}
          aria-label="Filter by status"
          className="w-auto min-w-36"
        >
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>

        {filtering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus("all");
              setQuery("");
            }}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}

        <span className="ml-auto text-[11px] tnum text-fg-subtle">
          {filtered.length} of {rows.length} deployments
        </span>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface raised">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No deployments match this filter"
            description="Nothing here matches the current search and status filter. Clear them to see all deployments."
            className="rounded-none border-0"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatus("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Deployment</TH>
                <TH>Project</TH>
                <TH>Model</TH>
                <TH>Status</TH>
                <TH>Region</TH>
                <TH className="text-right">Tasks</TH>
                <TH>Endpoint</TH>
                <TH>Last deployed</TH>
                <TH className="text-right">Requests · 48h</TH>
              </tr>
            </THead>
            <tbody>
              {filtered.map((row) => (
                <TR key={row.id}>
                  <TD className="whitespace-nowrap">
                    <Link
                      href={`/dashboard/deployments/${row.id}`}
                      className="font-medium text-fg transition-colors hover:text-accent"
                    >
                      {row.name}
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap">
                    <Link
                      href={`/dashboard/projects/${row.projectId}`}
                      className="transition-colors hover:text-fg"
                    >
                      {row.projectName}
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap font-mono text-[12px]">
                    {row.modelRef}
                  </TD>
                  <TD>
                    <StatusBadge status={row.status} />
                  </TD>
                  <TD className="whitespace-nowrap font-mono text-[12px]">
                    {row.region}
                  </TD>
                  <TD className="text-right tnum">{row.desiredCount}</TD>
                  <TD>
                    {row.endpointUrl ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          title={row.endpointUrl}
                          className="block max-w-[190px] truncate font-mono text-[12px] text-fg-muted"
                        >
                          {row.endpointUrl.replace(/^https:\/\//, "")}
                        </span>
                        <CopyButton
                          value={row.endpointUrl}
                          className="shrink-0"
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-pending">
                        <span className="size-1.5 animate-pulse-dot rounded-full bg-pending" />
                        Still provisioning
                      </span>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap tnum">
                    {row.lastDeployed ?? (
                      <span className="text-fg-subtle">Never</span>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-2.5">
                      <span className="tnum text-fg">
                        {row.requests48h > 0 ? formatNumber(row.requests48h) : "—"}
                      </span>
                      <span
                        className={cn(
                          "w-20 shrink-0",
                          row.requests48h === 0 && "invisible",
                        )}
                      >
                        <Sparkline
                          data={row.requests}
                          width={80}
                          height={24}
                          className="h-6"
                          label={`Requests over the last 48 hours for ${row.name}`}
                        />
                      </span>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
