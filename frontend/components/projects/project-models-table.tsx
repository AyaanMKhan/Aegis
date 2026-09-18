import * as React from "react";
import Link from "next/link";
import { MOCK_NOW } from "@/lib/mock-data";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { ModelStatusBadge } from "@/components/ui/badge";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import type { Model } from "@/types/api";

/** Rows link to the model; the overlay covers the row, copy controls sit above it. */
export function ProjectModelsTable({ models }: { models: Model[] }) {
  return (
    <Table>
      <THead>
        <tr>
          <TH>Model</TH>
          <TH className="w-24">Latest</TH>
          <TH className="hidden w-32 md:table-cell">Framework</TH>
          <TH className="w-24 text-right">Size</TH>
          <TH className="w-32">Status</TH>
          <TH className="hidden w-28 text-right sm:table-cell">Updated</TH>
        </tr>
      </THead>
      <tbody>
        {models.map((model) => {
          const version = model.latestVersion;
          return (
            <TR key={model.id} className="relative">
              <TD className="max-w-[16rem]">
                <Link
                  href={`/dashboard/models/${model.id}`}
                  className="block truncate text-[13px] font-medium text-fg after:absolute after:inset-0 after:content-['']"
                >
                  {model.name}
                </Link>
                {version?.status === "failed" && version.errorMessage ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-failed">
                    {version.errorMessage}
                  </p>
                ) : version?.status === "inspecting" ? (
                  <p className="mt-1 text-[11px] text-pending">
                    Reading the ONNX graph — schema not available yet
                  </p>
                ) : (
                  model.description && (
                    <p className="mt-1 truncate text-[11px] text-fg-subtle">
                      {model.description}
                    </p>
                  )
                )}
              </TD>

              <TD className="font-mono text-[12px] text-fg-muted">
                {version ? `v${version.version}` : "—"}
                {model.versionCount > 1 && (
                  <span className="text-fg-subtle">/{model.versionCount}</span>
                )}
              </TD>

              <TD className="hidden text-[12.5px] md:table-cell">
                {version?.framework ?? (
                  <span className="text-fg-subtle">—</span>
                )}
              </TD>

              <TD className="text-right text-[12.5px] tnum">
                {version ? formatBytes(version.fileSize) : "—"}
              </TD>

              <TD>
                {version ? (
                  <ModelStatusBadge status={version.status} />
                ) : (
                  <span className="text-[12px] text-fg-subtle">No versions</span>
                )}
              </TD>

              <TD className="hidden text-right text-[11px] tnum text-fg-subtle sm:table-cell">
                {formatRelativeTime(model.updatedAt, MOCK_NOW)}
              </TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}
