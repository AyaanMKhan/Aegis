"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EnvVar {
  id: string;
  key: string;
  value: string;
}

/** Stable ids without Math.random, so nothing differs between renders. */
export function toEnvVars(environment: Record<string, string>): EnvVar[] {
  return Object.entries(environment).map(([key, value], i) => ({
    id: `env_${i}`,
    key,
    value,
  }));
}

export function toEnvRecord(vars: EnvVar[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vars) {
    const key = v.key.trim();
    if (key) out[key] = v.value;
  }
  return out;
}

export function EnvVarEditor({
  vars,
  onChange,
}: {
  vars: EnvVar[];
  onChange: (next: EnvVar[]) => void;
}) {
  const nextId = React.useRef(0);

  const add = () => {
    nextId.current += 1;
    onChange([...vars, { id: `env_new_${nextId.current}`, key: "", value: "" }]);
  };

  const update = (id: string, patch: Partial<EnvVar>) => {
    onChange(vars.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  if (vars.length === 0) {
    return (
      <div className="rounded-control border border-dashed border-line-strong px-4 py-6 text-center">
        <p className="text-[13px] text-fg-muted">
          No environment variables. The runner already receives{" "}
          <span className="font-mono text-[12px]">MODEL_S3_URI</span> and{" "}
          <span className="font-mono text-[12px]">AEGIS_DEPLOYMENT_ID</span> from
          the task definition Terraform renders.
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={add}>
          <Plus className="size-4" />
          Add variable
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[1fr_1.4fr_auto] gap-2 px-1 sm:grid">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          Key
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          Value
        </span>
        <span className="w-9" />
      </div>

      {vars.map((v) => (
        <div
          key={v.id}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto]"
        >
          <Input
            value={v.key}
            onChange={(e) => update(v.id, { key: e.target.value })}
            placeholder="LOG_LEVEL"
            aria-label="Variable name"
            spellCheck={false}
            className="font-mono text-[12.5px]"
          />
          <Input
            value={v.value}
            onChange={(e) => update(v.id, { value: e.target.value })}
            placeholder="info"
            aria-label={`Value for ${v.key || "new variable"}`}
            spellCheck={false}
            className="font-mono text-[12.5px]"
          />
          <button
            type="button"
            onClick={() => onChange(vars.filter((x) => x.id !== v.id))}
            aria-label={`Remove ${v.key || "variable"}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line-strong bg-surface-2 text-fg-subtle transition-colors hover:border-failed/40 hover:text-failed"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={add} className="mt-1">
        <Plus className="size-4" />
        Add variable
      </Button>
    </div>
  );
}
