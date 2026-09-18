"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderGit2,
  KeyRound,
  LayoutDashboard,
  Rocket,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/ui/logo";
import { mockDashboardSummary } from "@/lib/mock-data";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only highlight on an exact match — otherwise /dashboard owns everything. */
  exact?: boolean;
  badge?: string;
}

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderGit2 },
  {
    href: "/dashboard/deployments",
    label: "Deployments",
    icon: Rocket,
    badge: String(mockDashboardSummary.liveDeployments),
  },
  { href: "/dashboard/api-keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[228px] shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard" className="rounded">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-surface-2 text-fg"
                  : "text-fg-muted hover:bg-surface-2/60 hover:text-fg",
              )}
            >
              {/* The active rail — the one structural use of the accent. */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-fg" : "text-fg-subtle group-hover:text-fg-muted",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] tnum text-fg-muted">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="rounded-control border border-line bg-surface-2 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-fg-subtle">
            <span>Est. spend</span>
            <span className="tnum text-fg-muted">
              ${mockDashboardSummary.monthlySpendUsd.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full w-[38%] rounded-full bg-accent" />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-fg-subtle">
            ALB + RDS baseline, billed whether or not a model is deployed.
          </p>
        </div>
      </div>
    </aside>
  );
}
