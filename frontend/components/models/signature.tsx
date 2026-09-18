import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { formatShape } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TensorSpec } from "@/types/api";

/**
 * The parsed ONNX signature, rendered the same way wherever it appears — on the
 * upload result and on the model page. Shapes go through `formatShape`, so a
 * dynamic axis always prints as `batch`.
 */

export function TensorTable({
  tensors,
  kind,
  className,
}: {
  tensors: TensorSpec[];
  kind: "input" | "output";
  className?: string;
}) {
  const Icon = kind === "input" ? ArrowDownToLine : ArrowUpFromLine;
  const label = kind === "input" ? "Inputs" : "Outputs";

  return (
    <section className={className}>
      <div className="flex items-center gap-2 px-4 pb-1 pt-3">
        <Icon className="size-3.5 text-fg-subtle" />
        <h4 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          {label}
        </h4>
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] tnum text-fg-subtle">
          {tensors.length}
        </span>
      </div>
      {tensors.length === 0 ? (
        <p className="px-4 pb-4 pt-1 text-[13px] text-fg-muted">
          The graph declares no {kind} tensors.
        </p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-[38%]">Name</TH>
              <TH>Shape</TH>
              <TH className="w-[22%]">Dtype</TH>
            </tr>
          </THead>
          <tbody>
            {tensors.map((tensor) => (
              <TR key={`${kind}-${tensor.name}`}>
                <TD className="font-mono text-[12.5px] text-fg">{tensor.name}</TD>
                <TD className="font-mono text-[12.5px] tnum">
                  {formatShape(tensor.shape)}
                </TD>
                <TD className="font-mono text-[12.5px]">{tensor.dtype}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  );
}

export function SignatureTables({
  inputs,
  outputs,
  className,
}: {
  inputs: TensorSpec[];
  outputs: TensorSpec[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-line", className)}>
      <TensorTable tensors={inputs} kind="input" />
      <TensorTable tensors={outputs} kind="output" />
    </div>
  );
}

/** Placeholder rows for a version whose graph is still being parsed. */
export function SignatureSkeleton({ className }: { className?: string }) {
  const widths = ["w-28", "w-40", "w-16"];
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          {widths.map((width, col) => (
            <div
              key={col}
              className={cn(
                "h-2.5 animate-pulse rounded-full bg-surface-3",
                width,
                row === 2 && "opacity-50",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** `sha256:9f2c41ab7e…d582ab19` — long enough to verify, short enough to sit in a row. */
export function truncateChecksum(value: string): string {
  const colon = value.indexOf(":");
  const algo = colon === -1 ? "" : value.slice(0, colon + 1);
  const digest = colon === -1 ? value : value.slice(colon + 1);
  if (digest.length <= 24) return value;
  return `${algo}${digest.slice(0, 10)}…${digest.slice(-8)}`;
}

export function ChecksumValue({
  value,
  truncate = true,
  className,
}: {
  value: string;
  truncate?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="font-mono text-[12px] break-all text-fg" title={value}>
        {truncate ? truncateChecksum(value) : value}
      </span>
      <CopyButton value={value} label={undefined} />
    </span>
  );
}
