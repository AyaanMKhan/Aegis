"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDashed,
  FileBox,
  Loader2,
  Minus,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModelStatusBadge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Field, Input, Textarea } from "@/components/ui/input";
import { DetailRow } from "@/components/ui/stat";
import { formatBytes } from "@/lib/format";
import { mockModelVersions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { ModelVersionStatus, TensorSpec } from "@/types/api";
import { ChecksumValue, SignatureTables, truncateChecksum } from "./signature";

/* ------------------------------------------------------------------ limits */

const MAX_BYTES = 2 * 1024 ** 3;
const MAX_OPSET = 18;

/** The runtime's real rejection, as recorded on `mv_velocity_1`. */
const OPSET_FAILURE =
  "Graph validation failed: opset 21 is newer than the runtime's supported maximum of 18.";

/* -------------------------------------------------------------- inspection */

interface PickedFile {
  name: string;
  size: number;
}

type Inspection =
  | {
      ok: true;
      checksum: string;
      framework: string;
      producerName: string;
      opsetVersion: number;
      inputs: TensorSpec[];
      outputs: TensorSpec[];
      /** Set when the file matches a version already in the catalogue. */
      versionId: string | null;
    }
  | {
      ok: false;
      checksum: string;
      declaredOpset: number;
      error: string;
    };

/** Deterministic stand-in for the SHA-256 the backend computes off the object. */
function derivedChecksum(seed: string): string {
  let h = 2166136261 >>> 0;
  let digest = "";
  for (let i = 0; i < 64; i += 1) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    digest += ((h >>> 26) & 0xf).toString(16);
  }
  return `sha256:${digest}`;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/\.onnx$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "model"
  );
}

/**
 * What the control plane would report back. Files that match a version already
 * in the catalogue replay that version's real parse; everything else gets a
 * plausible classifier signature. No randomness — the same file always yields
 * the same result.
 */
function inspect(file: PickedFile): Inspection {
  const known = mockModelVersions.find((v) => v.fileName === file.name);
  const checksum = known?.checksum ?? derivedChecksum(`${file.name}:${file.size}`);

  if (known?.status === "failed" || /velocity/i.test(file.name)) {
    return {
      ok: false,
      checksum: derivedChecksum(`${file.name}:${file.size}`),
      declaredOpset: 21,
      error: known?.errorMessage ?? OPSET_FAILURE,
    };
  }

  if (
    known &&
    known.status === "ready" &&
    known.framework &&
    known.producerName &&
    known.opsetVersion
  ) {
    return {
      ok: true,
      checksum,
      framework: known.framework,
      producerName: known.producerName,
      opsetVersion: known.opsetVersion,
      inputs: known.inputSchema,
      outputs: known.outputSchema,
      versionId: known.id,
    };
  }

  return {
    ok: true,
    checksum,
    framework: "PyTorch",
    producerName: "pytorch",
    opsetVersion: 17,
    inputs: [{ name: "input", shape: [null, 3, 224, 224], dtype: "float32" }],
    outputs: [{ name: "logits", shape: [null, 1000], dtype: "float32" }],
    versionId: null,
  };
}

function validate(file: PickedFile): string | null {
  if (!file.name.toLowerCase().endsWith(".onnx")) {
    return `${file.name} is not an .onnx file. Export the graph with torch.onnx.export or tf2onnx first.`;
  }
  if (file.size === 0) return `${file.name} is empty — nothing to upload.`;
  if (file.size > MAX_BYTES) {
    return `${file.name} is ${formatBytes(file.size)}. The upload limit is 2 GB.`;
  }
  return null;
}

/* ------------------------------------------------------------- the journey */

type Phase = "idle" | "uploading" | "inspecting" | "ready" | "failed";

const PHASE_STATUS: Record<
  Exclude<Phase, "idle">,
  { status: ModelVersionStatus; title: string }
> = {
  uploading: { status: "uploading", title: "Uploading to S3" },
  inspecting: { status: "inspecting", title: "Inspecting the graph" },
  ready: { status: "ready", title: "Signature extracted" },
  failed: { status: "failed", title: "Inspection failed" },
};

const STEPS = [
  { running: "Computing SHA-256 checksum", done: "Checksum computed" },
  { running: "Loading the ONNX graph", done: "Graph loaded" },
  { running: "Reading producer name and opset", done: "Producer and opset read" },
  { running: "Extracting input and output tensors", done: "Tensors extracted" },
] as const;

/** Validation rejects at the opset read, so the last step never runs. */
const FAIL_STEP = 2;

const UPLOAD_TICK_MS = 70;
const UPLOAD_STEP_PCT = 2.5;
const UPLOAD_SECONDS = (100 / UPLOAD_STEP_PCT) * (UPLOAD_TICK_MS / 1000);

/** Two files from the catalogue, so the flow is walkable without a local export. */
const SAMPLES: { file: PickedFile; hint: string }[] = [
  {
    file: { name: "resnet50-v3.onnx", size: 102_063_616 },
    hint: "PyTorch export, opset 17 — passes validation",
  },
  {
    file: { name: "velocity-check.onnx", size: 1_048_576 },
    hint: "opset 21 — rejected by the runtime",
  },
];

export function ModelUploadFlow({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<PickedFile | null>(null);
  const [result, setResult] = React.useState<Inspection | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [step, setStep] = React.useState(0);
  const [rejection, setRejection] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [name, setName] = React.useState("");
  const [nameTouched, setNameTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement>(null);

  /* --- the upload itself: a determinate bar driven off an interval --- */
  React.useEffect(() => {
    if (phase !== "uploading") return;
    const id = setInterval(() => {
      setProgress((p) => Math.min(100, p + UPLOAD_STEP_PCT));
    }, UPLOAD_TICK_MS);
    return () => clearInterval(id);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== "uploading" || progress < 100) return;
    const t = setTimeout(() => {
      setStep(0);
      setPhase("inspecting");
    }, 420);
    return () => clearTimeout(t);
  }, [phase, progress]);

  /* --- graph inspection: one step at a time, stopping where it breaks --- */
  React.useEffect(() => {
    if (phase !== "inspecting" || !result) return;
    if (!result.ok && step === FAIL_STEP) {
      const t = setTimeout(() => setPhase("failed"), 900);
      return () => clearTimeout(t);
    }
    if (step >= STEPS.length) {
      const t = setTimeout(() => setPhase("ready"), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 620);
    return () => clearTimeout(t);
  }, [phase, step, result]);

  function start(picked: PickedFile) {
    const problem = validate(picked);
    if (problem) {
      setRejection(problem);
      return;
    }
    setRejection(null);
    setFile(picked);
    setResult(inspect(picked));
    setProgress(0);
    setStep(0);
    setPhase("uploading");
    if (!nameTouched) setName(slugify(picked.name));
  }

  function reset() {
    setPhase("idle");
    setFile(null);
    setResult(null);
    setProgress(0);
    setStep(0);
    setRejection(null);
  }

  function retry() {
    if (!file) return;
    setProgress(0);
    setStep(0);
    setPhase("uploading");
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (picked) start({ name: picked.name, size: picked.size });
    event.target.value = "";
  }

  const storagePath = `s3://aegis-models/${projectId}/${slugify(name || file?.name || "model")}/v1.onnx`;
  const deployHref = result?.ok
    ? result.versionId
      ? `/dashboard/deployments/new?modelVersionId=${result.versionId}`
      : `/dashboard/deployments/new?projectId=${projectId}`
    : "#";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {phase === "idle" ? (
          <div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) start({ name: dropped.name, size: dropped.size });
              }}
              className={cn(
                "grid-bg flex flex-col items-center rounded-card border border-dashed px-6 py-14 text-center transition-colors duration-150",
                dragging
                  ? "border-accent bg-accent-faint/40"
                  : "border-line-strong bg-surface/40",
              )}
            >
              <div
                className={cn(
                  "mb-4 flex size-12 items-center justify-center rounded-xl border transition-colors",
                  dragging
                    ? "border-accent/40 bg-accent/10"
                    : "border-line bg-surface-2",
                )}
              >
                <UploadCloud
                  className={cn(
                    "size-5",
                    dragging ? "text-accent" : "text-fg-subtle",
                  )}
                />
              </div>
              <p className="text-sm font-medium text-fg">
                Drop your <span className="font-mono text-accent">.onnx</span> file
                here
              </p>
              <p className="mt-1.5 text-[13px] text-fg-muted">
                It uploads straight to S3 with a presigned URL.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".onnx"
                className="hidden"
                onChange={onPick}
              />
              <p className="mt-5 text-[11px] text-fg-subtle">
                Single <span className="font-mono">.onnx</span> file · up to 2 GB ·
                opset {MAX_OPSET} or lower
              </p>
            </div>

            {rejection && (
              <p className="mt-3 flex items-start gap-2 rounded-control border border-failed/25 bg-failed/10 px-3 py-2 text-[13px] text-failed">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>{rejection}</span>
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-fg-subtle">
                No export to hand? Try one of ours:
              </span>
              {SAMPLES.map((sample) => (
                <button
                  key={sample.file.name}
                  type="button"
                  title={sample.hint}
                  onClick={() => start(sample.file)}
                  className="inline-flex items-center gap-2 rounded-control border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  <FileBox className="size-3.5 text-fg-subtle" />
                  <span className="font-mono">{sample.file.name}</span>
                  <span className="tnum text-fg-subtle">
                    {formatBytes(sample.file.size)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          file && (
            <Card className="animate-rise">
              <CardHeader>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-surface-2">
                    <FileBox className="size-4 text-fg-subtle" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[13px] text-fg">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-[11px] tnum text-fg-subtle">
                      {formatBytes(file.size)} · {projectName}
                    </p>
                  </div>
                </div>
                <ModelStatusBadge status={PHASE_STATUS[phase].status} />
              </CardHeader>

              {phase === "uploading" && (
                <CardContent>
                  <UploadProgress
                    progress={progress}
                    total={file.size}
                    storagePath={storagePath}
                  />
                </CardContent>
              )}

              {(phase === "inspecting" || phase === "failed") && (
                <CardContent>
                  <InspectionSteps
                    step={step}
                    failed={phase === "failed"}
                    result={result}
                  />
                </CardContent>
              )}

              {phase === "failed" && result && !result.ok && (
                <CardContent className="border-t border-line">
                  <FailurePanel error={result.error} fileName={file.name} />
                </CardContent>
              )}

              {phase === "ready" && result?.ok && (
                <>
                  <CardContent>
                    <dl className="grid gap-x-8 sm:grid-cols-2">
                      <DetailRow label="Framework">{result.framework}</DetailRow>
                      <DetailRow label="Producer" mono>
                        {result.producerName}
                      </DetailRow>
                      <DetailRow label="Opset version">
                        <span className="tnum">{result.opsetVersion}</span>
                        <span className="ml-2 text-fg-subtle">
                          runtime max {MAX_OPSET}
                        </span>
                      </DetailRow>
                      <DetailRow label="File size">
                        <span className="tnum">{formatBytes(file.size)}</span>
                      </DetailRow>
                      <DetailRow label="Checksum">
                        <ChecksumValue value={result.checksum} />
                      </DetailRow>
                      <DetailRow label="Stored at" mono>
                        {storagePath}
                      </DetailRow>
                    </dl>
                  </CardContent>
                  <div className="border-t border-line">
                    <SignatureTables
                      inputs={result.inputs}
                      outputs={result.outputs}
                    />
                  </div>
                  <div className="border-t border-line px-5 py-3">
                    <p className="text-[12px] leading-relaxed text-fg-subtle">
                      These tensors become the version&rsquo;s{" "}
                      <span className="font-mono">inputSchema</span> and{" "}
                      <span className="font-mono">outputSchema</span>, which
                      generate the OpenAPI schema for every deployment of it.
                    </p>
                  </div>
                </>
              )}

              <CardFooter className="justify-between">
                <p className="text-[11px] text-fg-subtle">
                  {PHASE_STATUS[phase].title}
                </p>
                <div className="flex items-center gap-2">
                  {phase === "uploading" && (
                    <Button type="button" variant="ghost" size="sm" onClick={reset}>
                      <X className="size-4" />
                      Cancel upload
                    </Button>
                  )}
                  {phase === "inspecting" && (
                    <span className="text-[11px] text-fg-subtle">
                      Parsing runs on the control plane — safe to leave this page.
                    </span>
                  )}
                  {phase === "failed" && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={retry}
                      >
                        <RotateCcw className="size-4" />
                        Retry
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={reset}
                      >
                        Choose a different file
                      </Button>
                    </>
                  )}
                  {phase === "ready" && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={reset}
                      >
                        Upload another
                      </Button>
                      <ButtonLink href={deployHref} size="sm" variant="primary">
                        Deploy this model
                        <ArrowRight className="size-4" />
                      </ButtonLink>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          )
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Model details</CardTitle>
            </div>
            <span className="text-[11px] text-fg-subtle">Optional</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Model name"
              htmlFor="model-name"
              hint="Defaults to the file name. The container that every future version of this model hangs off."
            >
              <Input
                id="model-name"
                value={name}
                placeholder="resnet50-classifier"
                onChange={(event) => {
                  setNameTouched(true);
                  setName(event.target.value);
                }}
              />
            </Field>
            <Field
              label="Description"
              htmlFor="model-description"
              hint="What this model does and what it was trained on."
            >
              <Textarea
                id="model-description"
                value={description}
                placeholder="ImageNet-pretrained ResNet-50 fine-tuned on the product catalogue."
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>What happens after you drop a file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Presigned PUT to S3",
                body: "The control plane signs a URL and the browser uploads straight to the models bucket. The file never passes through the API.",
              },
              {
                title: "Graph inspection",
                body: "The API loads the graph with onnx, reads producer_name into framework, and records the opset version and SHA-256 checksum.",
              },
              {
                title: "The signature becomes the API",
                body: "Input and output tensors are stored as inputSchema and outputSchema — the same shapes that generate the OpenAPI docs for the deployment.",
              },
            ].map((item, index) => (
              <div key={item.title} className="flex gap-3">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-[10px] tnum text-fg-muted">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13px] font-medium text-fg">{item.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-fg-muted">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Format">
                <span className="font-mono text-[12px]">.onnx</span>
              </DetailRow>
              <DetailRow label="Max file size">
                <span className="tnum">2 GB</span>
              </DetailRow>
              <DetailRow label="Max opset">
                <span className="tnum">{MAX_OPSET}</span>
              </DetailRow>
              <DetailRow label="Execution provider">CPU (Fargate)</DetailRow>
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-fg-subtle">
              A graph above opset {MAX_OPSET} is rejected at inspection — re-export
              it against a lower opset rather than upgrading the runner.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

/* --------------------------------------------------------------- fragments */

function UploadProgress({
  progress,
  total,
  storagePath,
}: {
  progress: number;
  total: number;
  storagePath: string;
}) {
  const pct = Math.round(progress);
  const sent = Math.min(total, Math.round((progress / 100) * total));
  const rate = total / UPLOAD_SECONDS;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] tnum text-fg-muted">
          <span className="text-fg">{formatBytes(sent)}</span> of{" "}
          {formatBytes(total)}
        </p>
        <p className="text-sm font-medium tnum text-fg">{pct}%</p>
      </div>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload progress"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2.5 truncate font-mono text-[11px] text-fg-subtle">
        PUT {storagePath} · {formatBytes(rate)}/s
      </p>
    </div>
  );
}

function InspectionSteps({
  step,
  failed,
  result,
}: {
  step: number;
  failed: boolean;
  result: Inspection | null;
}) {
  function detailFor(index: number): string | null {
    if (!result) return null;
    if (index === 0) return truncateChecksum(result.checksum);
    if (!result.ok) {
      return index === FAIL_STEP ? `opset ${result.declaredOpset}` : null;
    }
    if (index === 2) return `${result.producerName} · opset ${result.opsetVersion}`;
    if (index === 3)
      return `${result.inputs.length} in · ${result.outputs.length} out`;
    return null;
  }

  return (
    <ol className="space-y-2.5">
      {STEPS.map((item, index) => {
        const isFailed = failed && index === FAIL_STEP;
        const isSkipped = failed && index > FAIL_STEP;
        const isDone = !isFailed && !isSkipped && index < step;
        const isRunning = !failed && index === step;
        const detail = isDone || isFailed ? detailFor(index) : null;

        return (
          <li key={item.done} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                isDone && "border-live/30 bg-live/10 text-live",
                isFailed && "border-failed/30 bg-failed/10 text-failed",
                isRunning && "border-line-strong bg-surface-2 text-fg-muted",
                !isDone && !isFailed && !isRunning && "border-line text-fg-subtle",
              )}
            >
              {isDone && <Check className="size-3" />}
              {isFailed && <X className="size-3" />}
              {isRunning && <Loader2 className="size-3 animate-spin" />}
              {isSkipped && <Minus className="size-3" />}
              {!isDone && !isFailed && !isRunning && !isSkipped && (
                <CircleDashed className="size-3" />
              )}
            </span>
            <span
              className={cn(
                "text-[13px]",
                isDone && "text-fg",
                isFailed && "text-failed",
                isRunning && "text-fg",
                (isSkipped || (!isDone && !isFailed && !isRunning)) &&
                  "text-fg-subtle",
              )}
            >
              {isDone || isFailed ? item.done : item.running}
              {isSkipped && " — skipped"}
            </span>
            {detail && (
              <span className="ml-auto truncate font-mono text-[11px] text-fg-subtle">
                {detail}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FailurePanel({
  error,
  fileName,
}: {
  error: string;
  fileName: string;
}) {
  return (
    <div className="rounded-card border border-failed/25 bg-failed/10 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-failed" />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-failed">
            {fileName} was rejected at inspection
          </h3>
          <p className="mt-1.5 font-mono text-[12.5px] leading-relaxed text-failed/90">
            {error}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
            The object is still in S3, but no version was created. Re-export the
            graph against opset {MAX_OPSET} or lower and upload it again.
          </p>
        </div>
      </div>
      <CodeBlock
        className="mt-3.5"
        filename="re-export.py"
        code={`torch.onnx.export(\n    model,\n    sample_input,\n    "${fileName}",\n    opset_version=17,\n)`}
      />
    </div>
  );
}
