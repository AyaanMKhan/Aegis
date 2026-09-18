import * as React from "react";
import { cn } from "@/lib/utils";

/** Centred icon + copy + action, used wherever a collection is empty. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid-bg flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2">
        <Icon className="size-5 text-fg-subtle" />
      </div>
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
