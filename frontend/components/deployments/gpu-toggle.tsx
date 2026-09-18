import * as React from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A switch that is deliberately inert.
 *
 * `DeploymentConfig.gpu` exists in the schema, but Fargate has no GPU — the
 * capability arrives with EC2-backed ECS in phase 5. Shipping a switch that
 * silently does nothing would be worse than showing a locked one.
 */
export function GpuToggle({
  checked = false,
  className,
}: {
  checked?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 rounded-control border border-line bg-surface-2/40 px-3.5 py-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-fg">
            GPU acceleration
          </span>
          <Badge tone="neutral">
            <Lock className="size-2.5" />
            Phase 5
          </Badge>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
          Fargate tasks have no GPU, so this cannot be enabled on the current
          runtime. The field is kept on{" "}
          <span className="font-mono">DeploymentConfig</span> so the schema does
          not change when GPU inference lands on EC2-backed ECS capacity
          providers.
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="GPU acceleration (unavailable on Fargate)"
        disabled
        className="mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full border border-line-strong bg-surface-3 p-0.5 opacity-50"
      >
        <span
          className={cn(
            "size-3.5 rounded-full bg-fg-subtle transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
