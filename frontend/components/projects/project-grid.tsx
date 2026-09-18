"use client";

import * as React from "react";
import { Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { ProjectCard, type ProjectCardData } from "./project-card";

type SortKey = "updated" | "name" | "models" | "deployments";

const sortLabels: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name (A–Z)" },
  { value: "models", label: "Most models" },
  { value: "deployments", label: "Most deployments" },
];

function compare(a: ProjectCardData, b: ProjectCardData, sort: SortKey): number {
  switch (sort) {
    case "name":
      return a.project.name.localeCompare(b.project.name);
    case "models":
      return b.project.modelCount - a.project.modelCount;
    case "deployments":
      return b.project.deploymentCount - a.project.deploymentCount;
    default:
      return (
        new Date(b.project.updatedAt).getTime() -
        new Date(a.project.updatedAt).getTime()
      );
  }
}

/**
 * Search + sort over the project cards. Client-only because the controls are
 * live; the data itself is handed down already resolved by the page.
 */
export function ProjectGrid({ items }: { items: ProjectCardData[] }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("updated");

  const needle = query.trim().toLowerCase();
  const visible = items
    .filter(({ project }) =>
      needle.length === 0
        ? true
        : [project.name, project.slug, project.description ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(needle),
    )
    .sort((a, b) => compare(a, b, sort));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort projects"
          className="sm:w-52"
        >
          {sortLabels.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <ProjectCard key={item.project.id} {...item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title={`No projects match “${query.trim()}”`}
          description="Search runs over project names, slugs and descriptions."
          action={
            <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      )}
    </div>
  );
}
