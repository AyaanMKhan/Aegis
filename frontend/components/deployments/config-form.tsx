"use client";

import * as React from "react";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Input, Select } from "@/components/ui/input";
import { formatCpu, formatMemory } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  FARGATE_CPU_UNITS,
  memoryOptionsFor,
  memoryRangeLabel,
  nearestLegalMemory,
} from "./fargate";
import { EnvVarEditor, toEnvVars, type EnvVar } from "./env-var-editor";
import { GpuToggle } from "./gpu-toggle";
import type { Deployment } from "@/types/api";

interface Draft {
  cpu: number;
  memory: number;
  desiredCount: number;
  minCapacity: number;
  maxCapacity: number;
  healthCheckPath: string;
  requestTimeoutSeconds: number;
  env: EnvVar[];
}

function draftFrom(deployment: Deployment): Draft {
  const c = deployment.config;
  return {
    cpu: c.cpu,
    memory: c.memory,
    desiredCount: c.desiredCount,
    minCapacity: c.minCapacity,
    maxCapacity: c.maxCapacity,
    healthCheckPath: c.healthCheckPath,
    requestTimeoutSeconds: c.requestTimeoutSeconds,
    env: toEnvVars(c.environment),
  };
}

interface Change {
  label: string;
  from: string;
  to: string;
}

function envChanges(
  before: Record<string, string>,
  after: EnvVar[],
): Change[] {
  const next: Record<string, string> = {};
  for (const v of after) {
    const key = v.key.trim();
    if (key) next[key] = v.value;
  }
  const keys = [...new Set([...Object.keys(before), ...Object.keys(next)])].sort();
  const out: Change[] = [];
  for (const key of keys) {
    const from = before[key];
    const to = next[key];
    if (from === to) continue;
    out.push({
      label: `env.${key}`,
      from: from ?? "unset",
      to: to ?? "removed",
    });
  }
  return out;
}

function changesFor(deployment: Deployment, draft: Draft): Change[] {
  const c = deployment.config;
  const out: Change[] = [];
  const push = (label: string, from: string | number, to: string | number) => {
    if (String(from) !== String(to)) {
      out.push({ label, from: String(from), to: String(to) });
    }
  };

  push("cpu", formatCpu(c.cpu), formatCpu(draft.cpu));
  push("memory", formatMemory(c.memory), formatMemory(draft.memory));
  push("desiredCount", c.desiredCount, draft.desiredCount);
  push("minCapacity", c.minCapacity, draft.minCapacity);
  push("maxCapacity", c.maxCapacity, draft.maxCapacity);
  push("healthCheckPath", c.healthCheckPath, draft.healthCheckPath);
  push(
    "requestTimeoutSeconds",
    `${c.requestTimeoutSeconds}s`,
    `${draft.requestTimeoutSeconds}s`,
  );
  return [...out, ...envChanges(c.environment, draft.env)];
}

/** Integer field that never leaves NaN in state. */
function intValue(raw: string, fallback: number): number {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : Math.max(0, Math.min(n, 999));
}

export function ConfigForm({ deployment }: { deployment: Deployment }) {
  const [draft, setDraft] = React.useState<Draft>(() => draftFrom(deployment));
  const [submitted, setSubmitted] = React.useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setSubmitted(false);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const changes = changesFor(deployment, draft);
  const dirty = changes.length > 0;

  const memoryOptions = memoryOptionsFor(draft.cpu);
  const countOutOfRange =
    draft.desiredCount > draft.maxCapacity ||
    draft.desiredCount < draft.minCapacity;
  const capacityInverted = draft.minCapacity > draft.maxCapacity;

  const reset = () => {
    setSubmitted(false);
    setDraft(draftFrom(deployment));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-4"
    >
      {/* ------------------------------------------------------- compute */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Compute</CardTitle>
            <CardDescription>
              The task size written into the ECS task definition.
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-control border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] tnum text-fg-muted">
            {draft.cpu} / {draft.memory}
          </span>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Task CPU"
            htmlFor="cpu"
            hint={`Fargate accepts five task sizes. At ${formatCpu(
              draft.cpu,
            )} the legal memory range is ${memoryRangeLabel(draft.cpu)}.`}
          >
            <Select
              id="cpu"
              value={draft.cpu}
              onChange={(e) => {
                const cpu = Number(e.target.value);
                setSubmitted(false);
                setDraft((d) => ({
                  ...d,
                  cpu,
                  // Memory must stay legal for the new CPU value.
                  memory: nearestLegalMemory(cpu, d.memory),
                }));
              }}
            >
              {FARGATE_CPU_UNITS.map((units) => (
                <option key={units} value={units}>
                  {formatCpu(units)} · {units} units
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Task memory"
            htmlFor="memory"
            hint="Only the values legal for the selected CPU are listed — ECS rejects any other pairing. Changing CPU snaps memory to the nearest legal value."
          >
            <Select
              id="memory"
              value={draft.memory}
              onChange={(e) => set("memory", Number(e.target.value))}
            >
              {memoryOptions.map((mib) => (
                <option key={mib} value={mib}>
                  {formatMemory(mib)} · {mib} MiB
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------- scaling */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Scaling</CardTitle>
            <CardDescription>
              How many tasks the service runs behind the target group.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Desired count"
              htmlFor="desiredCount"
              hint="Tasks ECS keeps running right now."
              error={
                countOutOfRange
                  ? `Must sit between the min (${draft.minCapacity}) and max (${draft.maxCapacity}).`
                  : undefined
              }
            >
              <Input
                id="desiredCount"
                type="number"
                min={0}
                max={99}
                value={draft.desiredCount}
                onChange={(e) =>
                  set("desiredCount", intValue(e.target.value, draft.desiredCount))
                }
                className="tnum"
              />
            </Field>
            <Field
              label="Min capacity"
              htmlFor="minCapacity"
              hint="Floor for the future scaling policy."
            >
              <Input
                id="minCapacity"
                type="number"
                min={0}
                max={99}
                value={draft.minCapacity}
                onChange={(e) =>
                  set("minCapacity", intValue(e.target.value, draft.minCapacity))
                }
                className="tnum"
              />
            </Field>
            <Field
              label="Max capacity"
              htmlFor="maxCapacity"
              hint="Ceiling for the future scaling policy."
              error={
                capacityInverted ? "Max must be at least the min." : undefined
              }
            >
              <Input
                id="maxCapacity"
                type="number"
                min={0}
                max={99}
                value={draft.maxCapacity}
                onChange={(e) =>
                  set("maxCapacity", intValue(e.target.value, draft.maxCapacity))
                }
                className="tnum"
              />
            </Field>
          </div>

          <p className="flex items-start gap-2 rounded-control border border-line bg-surface-2/40 px-3 py-2.5 text-xs leading-relaxed text-fg-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
            <span>
              Application Auto Scaling policies land in phase 5. Min and max are
              recorded on the deployment config and rendered into tfvars, but no
              scaling target is attached yet — the service holds at the desired
              count until then.
            </span>
          </p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------- accelerator */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Accelerator</CardTitle>
            <CardDescription>
              Hardware the inference session runs on.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <GpuToggle checked={deployment.config.gpu} />
          <p className="text-xs leading-relaxed text-fg-subtle">
            Until then every deployment runs{" "}
            <span className="font-mono">onnxruntime</span> on the{" "}
            <span className="font-mono">CPUExecutionProvider</span>. More vCPU is
            the only lever on inference speed.
          </p>
        </CardContent>
      </Card>

      {/* ------------------------------------------- networking and health */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Networking &amp; health</CardTitle>
            <CardDescription>
              What the ALB target group probes, and how long a request may run.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Health check path"
            htmlFor="healthCheckPath"
            hint="Polled by the target group. A task that fails it is replaced before it takes traffic."
          >
            <Input
              id="healthCheckPath"
              value={draft.healthCheckPath}
              onChange={(e) => set("healthCheckPath", e.target.value)}
              spellCheck={false}
              className="font-mono text-[12.5px]"
            />
          </Field>
          <Field
            label="Request timeout"
            htmlFor="requestTimeoutSeconds"
            hint="Seconds before the runner aborts an inference and returns 504."
          >
            <Input
              id="requestTimeoutSeconds"
              type="number"
              min={1}
              max={300}
              value={draft.requestTimeoutSeconds}
              onChange={(e) =>
                set(
                  "requestTimeoutSeconds",
                  intValue(e.target.value, draft.requestTimeoutSeconds),
                )
              }
              className="tnum"
            />
          </Field>
        </CardContent>
      </Card>

      {/* ------------------------------------------------- container image */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Container image</CardTitle>
            <CardDescription>
              Pulled from ECR by the task definition.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-control border border-line bg-surface-2 px-3 py-2.5">
            <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] text-fg-muted">
              {deployment.config.containerImage}
            </code>
            <CopyButton
              value={deployment.config.containerImage}
              className="shrink-0"
            />
          </div>
          <p className="text-xs leading-relaxed text-fg-subtle">
            Read-only. Phase 1 uses one shared runner image for every deployment;
            it reads <span className="font-mono">MODEL_S3_URI</span> at boot and
            loads the ONNX graph, which keeps a deploy at roughly 45 seconds
            instead of an eight-minute image build. Per-model images arrive with
            CodeBuild in phase 2, and this field becomes writable then.
          </p>
        </CardContent>
      </Card>

      {/* -------------------------------------------- environment variables */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Environment variables</CardTitle>
            <CardDescription>
              Rendered into the task definition&apos;s container environment.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <EnvVarEditor vars={draft.env} onChange={(env) => set("env", env)} />
        </CardContent>
      </Card>

      {/* ---------------------------------------------------- pending diff */}
      {dirty && (
        <Card className="border-accent/20">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>
                Pending changes
                <span className="ml-2 text-fg-subtle tnum">
                  {changes.length}
                </span>
              </CardTitle>
              <CardDescription>
                What the next apply would change on this service.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="py-1">
            <ul className="divide-y divide-line">
              {changes.map((change) => (
                <li
                  key={change.label}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 font-mono text-[12px]"
                >
                  <span className="text-fg-muted">{change.label}</span>
                  <span className="text-fg-subtle line-through">
                    {change.from}
                  </span>
                  <ArrowRight className="size-3 text-fg-subtle" />
                  <span className="text-accent">{change.to}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------ action bar */}
      <div
        className={cn(
          "sticky bottom-0 z-20 -mx-4 border-t border-line bg-base/85 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex max-w-xl items-start gap-2 text-[12px] leading-relaxed text-fg-subtle">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-pending" />
            <span>
              Saving runs a real{" "}
              <span className="font-mono">terraform apply</span> against{" "}
              <span className="font-mono">
                {deployment.tfStateKey ?? "this deployment's state key"}
              </span>{" "}
              and rolls the ECS service. Running tasks keep serving until the
              replacement passes its health check.
            </span>
          </p>

          <div className="flex items-center gap-2">
            {submitted && (
              <span className="text-[12px] text-fg-muted">
                Not sent — the control plane API lands in phase 3.
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!dirty}
              onClick={reset}
            >
              Discard
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!dirty || countOutOfRange || capacityInverted}
            >
              Save and redeploy
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
