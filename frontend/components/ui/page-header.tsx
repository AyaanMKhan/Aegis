import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px]">
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <ChevronRight className="size-3.5 text-fg-subtle" />}
          {item.href ? (
            <Link
              href={item.href}
              className="text-fg-muted transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-fg">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** Title block for every dashboard page: crumbs, title, description, actions. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-fg">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
