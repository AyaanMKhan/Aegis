"use client";

import * as React from "react";
import { BASE_DOMAIN } from "@/lib/mock-data";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

/** "Vision Pipeline 2" -> "vision-pipeline-2" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Same rules, but a trailing hyphen survives — otherwise the separator is
 * deleted the moment it is typed and a multi-word slug is impossible to write.
 */
function sanitiseSlugInput(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 48);
}

const regions: { value: string; label: string; available: boolean }[] = [
  { value: "us-east-1", label: "us-east-1 · N. Virginia", available: true },
  { value: "us-west-2", label: "us-west-2 · Oregon", available: false },
  { value: "eu-west-1", label: "eu-west-1 · Ireland", available: false },
  {
    value: "ap-southeast-2",
    label: "ap-southeast-2 · Sydney",
    available: false,
  },
];

export function NewProjectForm() {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  // Once the slug is edited by hand it stops following the name.
  const [slugEdited, setSlugEdited] = React.useState(false);

  const derivedSlug = slugify(name);
  const effectiveSlug = slugEdited ? slug : derivedSlug;
  const canSubmit = name.trim().length > 0 && effectiveSlug.length > 0;

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Card>
        <CardContent className="space-y-5 py-5">
          <Field
            label="Project name"
            htmlFor="project-name"
            required
            hint="Something you will recognise in a list — “Vision Pipeline”, “Fraud Scoring”."
          >
            <Input
              id="project-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vision Pipeline"
              autoComplete="off"
              autoFocus
              required
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="project-slug"
            hint="Derived from the name as you type. Used in project URLs and as the Terraform state prefix for everything deployed here. Edit it if you want a different one."
          >
            <div className="flex items-stretch overflow-hidden rounded-control border border-line-strong bg-surface-2 transition-colors focus-within:border-fg-muted">
              <span
                className="flex shrink-0 items-center border-r border-line-strong bg-surface px-3 font-mono text-[13px] text-fg-subtle"
                aria-hidden
              >
                {BASE_DOMAIN}/
              </span>
              <Input
                id="project-slug"
                name="slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(sanitiseSlugInput(e.target.value));
                }}
                placeholder={derivedSlug || "vision-pipeline"}
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-none border-0 bg-transparent font-mono hover:border-0"
              />
            </div>
          </Field>

          <Field
            label="Description"
            htmlFor="project-description"
            hint="Optional. Shown on the projects list so the next person knows what lives here."
          >
            <Textarea
              id="project-description"
              name="description"
              placeholder="Image classification and detection models serving the product catalogue."
              rows={3}
            />
          </Field>

          <Field
            label="Region"
            htmlFor="project-region"
            hint="Only us-east-1 is provisioned today — the shared ALB, ECR registry and RDS instance all live there."
          >
            <Select id="project-region" name="region" defaultValue="us-east-1">
              {regions.map((region) => (
                <option
                  key={region.value}
                  value={region.value}
                  disabled={!region.available}
                >
                  {region.label}
                  {region.available ? "" : " — not yet available"}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>

        <CardFooter>
          <ButtonLink href="/dashboard/projects" variant="ghost" size="sm">
            Cancel
          </ButtonLink>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            Create project
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
