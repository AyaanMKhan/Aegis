"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

/** Underlined tab strip. Controlled by the caller. */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-line", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b px-3 py-2.5 text-[13px] transition-colors",
              isActive
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tnum",
                  isActive ? "bg-surface-3 text-fg" : "bg-surface-2 text-fg-subtle",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
