import * as React from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/logo";
import { mockUser } from "@/lib/mock-data";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-base/80 px-4 backdrop-blur-xl md:px-6">
      <Link href="/dashboard" className="rounded md:hidden">
        <Wordmark />
      </Link>

      <div className="hidden min-w-0 flex-1 md:block">
        <button
          type="button"
          className="flex h-8 w-full max-w-xs items-center gap-2 rounded-control border border-line bg-surface-2 px-2.5 text-[13px] text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border border-line-strong bg-surface-3 px-1.5 py-px font-mono text-[10px]">
            /
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ButtonLink href="/dashboard/projects/new" size="sm" variant="primary">
          New project
        </ButtonLink>
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-8 items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Bell className="size-4" />
        </button>
        <div
          className="flex size-7 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-[11px] font-medium text-fg-muted"
          title={mockUser.email}
        >
          {initials(mockUser.name)}
        </div>
      </div>
    </header>
  );
}
