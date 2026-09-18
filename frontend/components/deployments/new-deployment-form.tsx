"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Rocket } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { ModelStatusBadge } from "@/components/ui/badge";
import { formatBytes, formatCpu, formatMemory } from "@/lib/format";
import {
  FARGATE_CPU_UNITS,
  memoryOptionsFor,
  memoryRangeLabel,
  nearestLegalMemory,
} from "./fargate";

/** A deployable model version, flattened by the server page. */
export interface DeployableVersion {
  versionId: string;
  modelId: string;
  modelName: string;
  projectId: string;
  projectName: string;
  version: number;
  framework: string | null;
  fileSize: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Looser than slugify so a hyphen survives while you are still typing. */
function sanitiseSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, "");
}

export function NewDeploymentForm({
  versions,
  baseDomain,
  initialVersionId,
}: {
  versions: DeployableVersion[];
  baseDomain: string;
  initialVersionId: string | null;
}) {
  const [versionId, setVersionId] = React.useState(
    initialVersionId && versions.some((v) => v.versionId === initialVersionId)
      ? initialVersionId
      : (versions[0]?.versionId ?? ""),
  );
  const selected = versions.find((v) => v.versionId === versionId);

  const derivedName = selected ? `${selected.modelName}-prod` : "";
  const [name, setName] = React.useState(derivedName);
  const [slug, setSlug] = React.useState(slugify(derivedName));
  const [slugEdited, setSlugEdited] = React.useState(false);

  const [cpu, setCpu] = React.useState(1024);
  const [memory, setMemory] = React.useState(2048);
  const [desiredCount, setDesiredCount] = React.useState(2);
  const [submitted, setSubmitted] = React.useState(false);

  // The name follows the selected version until the user takes over the slug.
  React.useEffect(() => {
    if (!selected) return;
    const next = `${selected.modelName}-prod`;
    setName(next);
    if (!slugEdited) setSlug(slugify(next));
  }, [selected, slugEdited]);

  function onCpuChange(next: number) {
    setCpu(next);
    setMemory((m) => nearestLegalMemory(next, m));
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2">
            <Rocket className="size-5 text-fg-subtle" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-fg">
              No model version is ready to deploy
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">
              A deployment pins one inspected model version. Upload an{" "}
              <span className="font-mono text-[12px]">.onnx</span> file and let
              the graph inspection finish, then come back.
            </p>
          </div>
          <ButtonLink href="/dashboard/projects" size="sm">
            Choose a project
            <ArrowRight />
          </ButtonLink>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Model version</CardTitle>
            <CardDescription>
              A deployment pins exactly one version. Shipping a new build is
              always an explicit redeploy.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Version" htmlFor="version" required>
            <Select
              id="version"
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
            >
              {versions.map((v) => (
                <option key={v.versionId} value={v.versionId}>
                  {v.projectName} / {v.modelName} · v{v.version}
                </option>
              ))}
            </Select>
          </Field>

          {selected && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-line bg-surface-2 px-3 py-2.5 text-[12px] text-fg-muted">
              <ModelStatusBadge status="ready" />
              <span className="font-mono text-[11.5px]">
                {selected.modelName}:v{selected.version}
              </span>
              <span>{selected.framework ?? "Unknown framework"}</span>
              <span className="tnum">{formatBytes(selected.fileSize)}</span>
              <Link
                href={`/dashboard/models/${selected.modelId}`}
                className="ml-auto text-fg-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-fg"
              >
                View model
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Identity</CardTitle>
            <CardDescription>
              The slug becomes the path the shared ALB routes on, and is fixed
              once the listener rule exists.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name" htmlFor="dep-name" required>
            <Input
              id="dep-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder="resnet50-prod"
            />
          </Field>

          <Field
            label="Endpoint"
            htmlFor="dep-slug"
            hint="Derived from the name until you edit it."
          >
            <div className="flex items-center rounded-control border border-line-strong bg-surface-2 focus-within:border-fg-muted">
              <span className="shrink-0 border-r border-line-strong px-3 py-2 font-mono text-[12px] text-fg-subtle">
                {baseDomain}/d/
              </span>
              <input
                id="dep-slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(sanitiseSlug(e.target.value));
                }}
                className="h-9 min-w-0 flex-1 bg-transparent px-3 font-mono text-[12px] text-fg placeholder:text-fg-subtle focus:outline-none"
                placeholder="resnet50-prod"
              />
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Task size</CardTitle>
            <CardDescription>
              Fargate only accepts certain CPU and memory pairs, so changing the
              CPU snaps memory to the nearest legal value.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field
            label="CPU"
            htmlFor="cpu"
            hint={`Memory ${memoryRangeLabel(cpu)}`}
          >
            <Select
              id="cpu"
              value={cpu}
              onChange={(e) => onCpuChange(Number(e.target.value))}
            >
              {FARGATE_CPU_UNITS.map((units) => (
                <option key={units} value={units}>
                  {formatCpu(units)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Memory" htmlFor="memory">
            <Select
              id="memory"
              value={memory}
              onChange={(e) => setMemory(Number(e.target.value))}
            >
              {memoryOptionsFor(cpu).map((mib) => (
                <option key={mib} value={mib}>
                  {formatMemory(mib)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Desired count"
            htmlFor="count"
            hint="ECS tasks kept running."
          >
            <Input
              id="count"
              type="number"
              min={1}
              max={10}
              value={desiredCount}
              onChange={(e) =>
                setDesiredCount(Math.max(1, Math.min(10, Number(e.target.value))))
              }
              className="tnum"
            />
          </Field>
        </CardContent>
        <CardFooter className="justify-start">
          <p className="text-[12px] text-fg-subtle">
            GPU is unavailable on Fargate and stays schema-only until EC2-backed
            ECS in phase 5.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-pending" />
            <p className="max-w-md text-[12.5px] leading-relaxed text-fg-muted">
              Creating runs a real{" "}
              <span className="font-mono text-[12px] text-fg">
                terraform apply
              </span>{" "}
              against a fresh state key, provisioning an ECS service, a target
              group, and an ALB listener rule. Expect about 45 seconds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ButtonLink
              href="/dashboard/deployments"
              variant="ghost"
              size="sm"
            >
              Cancel
            </ButtonLink>
            <Button type="submit" size="sm" disabled={!name || !slug}>
              <Rocket />
              Create deployment
            </Button>
          </div>
        </CardContent>
      </Card>

      {submitted && (
        <p
          role="status"
          className="rounded-control border border-line bg-surface-2 px-3 py-2 text-[12.5px] text-fg-muted"
        >
          Not sent — the control plane API that runs{" "}
          <span className="font-mono text-[12px]">terraform apply</span> lands in
          phase 3.
        </p>
      )}
    </form>
  );
}
