"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { segment: "", label: "Overview" },
  { segment: "configure", label: "Configuration" },
  { segment: "test", label: "Playground" },
  { segment: "docs", label: "API docs" },
  { segment: "logs", label: "Logs" },
  { segment: "monitoring", label: "Monitoring" },
  { segment: "settings", label: "Settings" },
];

/** Sub-navigation shared by every deployment detail route. */
export function DeploymentNav({ deploymentId }: { deploymentId: string }) {
  const pathname = usePathname();
  const root = `/dashboard/deployments/${deploymentId}`;

  return (
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const href = tab.segment ? `${root}/${tab.segment}` : root;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b px-3 py-2.5 text-[13px] transition-colors",
              active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
