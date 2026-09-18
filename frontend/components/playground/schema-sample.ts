/**
 * Example payload generation from a stored ONNX tensor signature.
 *
 * Phase 4 generates the per-deployment docs and playground from the
 * `inputSchema` / `outputSchema` read off the graph at upload time, so
 * everything here is derived from a `ModelVersion` and nothing is hand-written.
 *
 * Deterministic by construction — the pseudo-random stream is seeded from the
 * model version id and tensor name, so the server and the client always render
 * byte-identical payloads. Never `Math.random()`.
 */

import type { ModelVersion, TensorSpec } from "@/types/api";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/* --------------------------------------------------------------- internals */

/** Numbers printed on the innermost axis before it is elided. */
const LEAF_LIMIT = 6;
/** Sub-arrays printed on an outer axis before it is elided. */
const ROW_LIMIT = 2;
/** Tensors with at most this many elements are printed in full. */
const FULL_LIMIT = 24;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 0..1 stream — the same LCG the fixtures use. */
function seeded(seed: number): () => number {
  let s = (seed || 1) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function round(value: number, places = 4): number {
  const f = Math.pow(10, places);
  return Math.round(value * f) / f;
}

function isFloatDtype(dtype: string): boolean {
  return /^(float|double|bfloat)/.test(dtype);
}

function isIntDtype(dtype: string): boolean {
  return /^(u?int)/.test(dtype);
}

/** `[null, 3, 224, 224]` with the batch axis resolved to a single item. */
function resolveDims(shape: (number | null)[]): number[] {
  const dims = shape.map((d) => (d === null || d < 1 ? 1 : d));
  return dims.length === 0 ? [1] : dims;
}

function product(dims: number[]): number {
  return dims.reduce((a, b) => a * b, 1);
}

function elided(remaining: number): string {
  return `… ${groupDigits(remaining)} more`;
}

/** 150528 -> "150,528". Locale-independent so SSR and the client agree. */
export function groupDigits(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type LeafBuilder = (size: number, full: boolean) => JsonValue[];

/** Walks the outer axes, delegating the innermost one to `leaf`. */
function buildNested(dims: number[], full: boolean, leaf: LeafBuilder): JsonValue[] {
  const size = dims[0] ?? 1;
  const rest = dims.slice(1);
  if (rest.length === 0) return leaf(size, full);

  const shown = full ? size : Math.min(size, ROW_LIMIT);
  const rows: JsonValue[] = [];
  for (let i = 0; i < shown; i++) rows.push(buildNested(rest, full, leaf));
  if (size > shown) rows.push(elided(size - shown));
  return rows;
}

function scalarLeaf(next: () => JsonValue): LeafBuilder {
  return (size, full) => {
    const shown = full ? size : Math.min(size, LEAF_LIMIT);
    const out: JsonValue[] = [];
    for (let i = 0; i < shown; i++) out.push(next());
    if (size > shown) out.push(elided(size - shown));
    return out;
  };
}

/* ------------------------------------------------------------- public API */

/** ONNX dtype -> the JSON scalar it serialises as. */
export function jsonTypeFor(dtype: string): string {
  if (isFloatDtype(dtype) || isIntDtype(dtype)) return "number";
  if (dtype === "bool") return "boolean";
  return "string";
}

/** `number[][][][]` for a rank-4 float tensor. */
export function jsonTypeLabel(spec: TensorSpec): string {
  const rank = Math.max(spec.shape.length, 1);
  return `${jsonTypeFor(spec.dtype)}${"[]".repeat(rank)}`;
}

/** Values carried by a single batch item — 3 × 224 × 224 = 150,528. */
export function elementsPerItem(spec: TensorSpec): number {
  return product(resolveDims(spec.shape).slice(1));
}

/** One generated sentence describing a tensor, exact about rank and axes. */
export function describeTensor(spec: TensorSpec): string {
  const rank = spec.shape.length;
  const trailing = resolveDims(spec.shape).slice(1);
  const head = `Rank-${rank} ${spec.dtype} tensor.`;
  if (trailing.length === 0) {
    return `${head} One value per item in the batch.`;
  }
  const per = product(trailing);
  const factors = trailing.join(" × ");
  return `${head} Axis 0 is the batch dimension; each item carries ${
    trailing.length > 1 ? `${factors} = ` : ""
  }${groupDigits(per)} value${per === 1 ? "" : "s"}.`;
}

/** `[1,3,224,224]` — the compact form the runner uses in error messages. */
export function compactShape(shape: (number | null)[], batch = 1): string {
  return `[${shape.map((d) => (d === null ? batch : d)).join(",")}]`;
}

/** `[batch,3,224,224]` — the signature side of a shape-mismatch message. */
export function compactSignature(shape: (number | null)[]): string {
  return `[${shape.map((d) => (d === null ? "batch" : d)).join(",")}]`;
}

/**
 * A plausible wrong shape for the 422 example. Rank-4 image tensors get both
 * spatial axes bumped, which reproduces the real log line in `mockLogs`:
 * `shape [1,3,256,256] does not match [batch,3,224,224]`.
 */
export function mismatchShape(spec: TensorSpec): string {
  const dims = resolveDims(spec.shape);
  const bumped = [...dims];
  const bump = (i: number) => {
    const d = bumped[i] ?? 1;
    bumped[i] = d >= 64 ? d + 32 : d + 1;
  };
  bump(dims.length - 1);
  if (dims.length >= 4) bump(dims.length - 2);
  return `[${bumped.join(",")}]`;
}

/* ------------------------------------------------------- example payloads */

function requestTensor(spec: TensorSpec, versionId: string): JsonValue[] {
  const rand = seeded(hashString(`${versionId}:in:${spec.name}`));
  const dims = resolveDims(spec.shape);
  const rank = spec.shape.length;
  const next = (): JsonValue => {
    if (isFloatDtype(spec.dtype)) {
      // Image-shaped tensors arrive normalised to [0, 1); flat feature and
      // audio tensors are signed.
      return round(rank >= 3 ? rand() : rand() * 2 - 1);
    }
    if (isIntDtype(spec.dtype)) return Math.floor(rand() * 8);
    if (spec.dtype === "bool") return rand() > 0.5;
    return "…";
  };
  return buildNested(dims, product(dims) <= FULL_LIMIT, scalarLeaf(next));
}

/** `{ "input": [[[[…]]]] }` — keyed by input tensor name, batch size 1. */
export function exampleRequestObject(version: ModelVersion): Record<string, JsonValue> {
  const body: Record<string, JsonValue> = {};
  for (const spec of version.inputSchema) {
    body[spec.name] = requestTensor(spec, version.id);
  }
  return body;
}

/** The output tensor that reads as a distribution, if the graph has one. */
function distributionOutput(version: ModelVersion): TensorSpec | null {
  const floats = version.outputSchema.filter((s) => isFloatDtype(s.dtype));
  const named = floats.find((s) => /prob|score|conf|softmax/i.test(s.name));
  if (named) return named;
  return (
    floats.find((s) => {
      const last = resolveDims(s.shape).slice(-1)[0] ?? 1;
      return last > 1 && last <= 32;
    }) ?? null
  );
}

function simplexLeaf(rand: () => number, dominant: number): LeafBuilder {
  return (size, full) => {
    const raw = Array.from({ length: size }, () => 0.15 + rand());
    const d = Math.min(dominant, size - 1);
    raw[d] = (raw[d] ?? 1) * (12 + rand() * 18);
    const sum = raw.reduce((a, b) => a + b, 0);
    const vals = raw.map((v) => round(v / sum));
    const others = vals.reduce((a, v, i) => (i === d ? a : a + v), 0);
    vals[d] = round(1 - others);

    const shown = full ? size : Math.min(size, LEAF_LIMIT);
    const out: JsonValue[] = vals.slice(0, shown);
    if (size > shown) out.push(elided(size - shown));
    return out;
  };
}

/** `{ "logits": [[…]] }` — keyed by output tensor name, mirroring the request. */
export function exampleResponseObject(version: ModelVersion): Record<string, JsonValue> {
  const dist = distributionOutput(version);
  const distSize = dist ? (resolveDims(dist.shape).slice(-1)[0] ?? 1) : 0;
  const dominant = dist ? hashString(version.id) % distSize : 0;

  const body: Record<string, JsonValue> = {};
  for (const spec of version.outputSchema) {
    const rand = seeded(hashString(`${version.id}:out:${spec.name}`));
    const dims = resolveDims(spec.shape);
    const full = product(dims) <= FULL_LIMIT;

    if (dist && spec.name === dist.name) {
      body[spec.name] = buildNested(dims, full, simplexLeaf(rand, dominant));
      continue;
    }
    if (dist && isIntDtype(spec.dtype) && spec.shape.length <= 1) {
      // A per-item class label: keep it consistent with the argmax above.
      body[spec.name] = buildNested(dims, full, scalarLeaf(() => dominant));
      continue;
    }
    const next = (): JsonValue => {
      if (isFloatDtype(spec.dtype)) return round(rand() * 14 - 4);
      if (isIntDtype(spec.dtype)) return Math.floor(rand() * 8);
      if (spec.dtype === "bool") return rand() > 0.5;
      return "…";
    };
    body[spec.name] = buildNested(dims, full, scalarLeaf(next));
  }
  return body;
}

/* ---------------------------------------------------------- serialisation */

function isPrimitive(value: JsonValue): boolean {
  return !Array.isArray(value) && (value === null || typeof value !== "object");
}

/**
 * JSON, but numeric leaf arrays stay on one line — `JSON.stringify(x, null, 2)`
 * would put all 150,528 floats on their own row.
 */
export function renderJson(value: JsonValue, indent = 0): string {
  const pad = " ".repeat(indent);
  const inner = " ".repeat(indent + 2);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every(isPrimitive)) {
      return `[${value.map((v) => JSON.stringify(v)).join(", ")}]`;
    }
    const rows = value.map((v) => `${inner}${renderJson(v, indent + 2)}`);
    return `[\n${rows.join(",\n")}\n${pad}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    const rows = entries.map(
      ([k, v]) => `${inner}${JSON.stringify(k)}: ${renderJson(v, indent + 2)}`,
    );
    return `{\n${rows.join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}

/** Pretty request body, ready to seed the playground editor. */
export function exampleRequestBody(version: ModelVersion): string {
  return renderJson(exampleRequestObject(version));
}

/** Pretty response body, matching the real `outputSchema`. */
export function exampleResponseBody(version: ModelVersion): string {
  return renderJson(exampleResponseObject(version));
}

/** True when a payload contains an elided axis, so the UI can say so. */
export function hasElision(text: string): boolean {
  return text.includes("… ");
}
