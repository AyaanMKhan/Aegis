import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/**
 * Monospace block with an optional filename bar and a copy affordance.
 * Highlighting is intentionally absent — token colour is applied by callers
 * that build spans, so nothing here depends on a syntax runtime.
 */
export function CodeBlock({
  code,
  filename,
  language,
  className,
  copyable = true,
}: {
  code: string;
  filename?: string;
  language?: string;
  className?: string;
  copyable?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-line bg-code",
        className,
      )}
    >
      {(filename || language || copyable) && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2">
          <span className="font-mono text-[11px] text-fg-subtle">
            {filename ?? language}
          </span>
          {copyable && <CopyButton value={code} />}
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3.5">
        <code className="font-mono text-[12.5px] leading-[1.7] text-fg-muted">
          {code}
        </code>
      </pre>
    </div>
  );
}
