"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CornerDownLeft,
  Loader2,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { Field, Select, Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { formatBytes, formatLatency } from "@/lib/format";
import {
  buildSnippet,
  SNIPPET_LANGUAGES,
  type SnippetLanguage,
} from "./snippets";

export interface PlaygroundKey {
  id: string;
  name: string;
  keyPrefix: string;
  revoked: boolean;
}

export interface PlaygroundConsoleProps {
  /** `https://aegis.sh/d/<slug>` once the ALB rule exists, else null. */
  endpointUrl: string | null;
  /** The URL the deployment will answer on once provisioning finishes. */
  plannedUrl: string;
  slug: string;
  /** Rendered in the response headers, e.g. `resnet50-classifier:v3`. */
  modelLabel: string;
  /** Tag of the runner image serving this deployment. */
  runnerTag: string;
  degraded: boolean;
  desiredCount: number;
  /** Deterministic example body generated from the input tensor schema. */
  exampleBody: string;
  /** Deterministic example response generated from the output tensor schema. */
  exampleResponse: string;
  outputName: string;
  p50LatencyMs: number;
  p95LatencyMs: number;
  keys: PlaygroundKey[];
}

interface PlaygroundResponse {
  status: number;
  statusText: string;
  latencyMs: number;
  body: string;
  headers: [string, string][];
}

/** Deterministic request ids — no Math.random anywhere in the console. */
function requestId(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `req_${(h >>> 0).toString(16).padStart(8, "0").slice(0, 6)}`;
}

const LATENCY_JITTER = [3, -2, 6, 1];

export function PlaygroundConsole({
  endpointUrl,
  plannedUrl,
  slug,
  modelLabel,
  runnerTag,
  degraded,
  desiredCount,
  exampleBody,
  exampleResponse,
  outputName,
  p50LatencyMs,
  p95LatencyMs,
  keys,
}: PlaygroundConsoleProps) {
  const activeKeys = keys.filter((k) => !k.revoked);
  const [keyId, setKeyId] = React.useState(activeKeys[0]?.id ?? "");
  const [body, setBody] = React.useState(exampleBody);
  const [pending, setPending] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<PlaygroundResponse | null>(null);
  const [sendCount, setSendCount] = React.useState(0);
  const [responseTab, setResponseTab] = React.useState("body");
  const [language, setLanguage] = React.useState<SnippetLanguage>("curl");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const selectedKey = keys.find((k) => k.id === keyId) ?? activeKeys[0];
  const baseUrl = endpointUrl ?? plannedUrl;
  const predictUrl = `${baseUrl}/predict`;
  const predictPath = `/d/${slug}/predict`;
  const live = endpointUrl !== null;
  const dirty = body !== exampleBody;

  function send() {
    if (!live || pending) return;

    try {
      JSON.parse(body);
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Request body is not valid JSON.",
      );
      setResponse(null);
      return;
    }

    setParseError(null);
    setPending(true);
    const n = sendCount + 1;
    setSendCount(n);

    const latency = Math.max(
      1,
      (degraded && n === 1 ? p95LatencyMs : p50LatencyMs) +
        (LATENCY_JITTER[n % LATENCY_JITTER.length] ?? 0),
    );
    const id = requestId(`${slug}:${n}`);
    const bytes = exampleResponse.length;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPending(false);
      setResponseTab("body");
      setResponse({
        status: 200,
        statusText: "OK",
        latencyMs: latency,
        body: exampleResponse,
        headers: [
          ["content-type", "application/json"],
          ["content-length", String(bytes)],
          ["x-aegis-request-id", id],
          ["x-aegis-model", modelLabel],
          ["x-aegis-latency-ms", String(latency)],
          ["x-ratelimit-limit", "600"],
          ["x-ratelimit-remaining", String(600 - n)],
          ["server", `aegis-runner/${runnerTag}`],
        ],
      });
    }, 220 + Math.min(latency, 400));
  }

  return (
    <div className="space-y-4">
      {!live && (
        <div className="flex items-start gap-3 rounded-card border border-pending/25 bg-pending/5 px-4 py-3.5">
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-pending" />
          <div className="min-w-0 text-[13px] leading-relaxed">
            <p className="font-medium text-fg">This endpoint does not exist yet</p>
            <p className="mt-1 text-fg-muted">
              <code className="font-mono text-[12px]">terraform apply</code> is
              still creating the target group and ALB listener rule for this
              deployment, so there is nothing to send a request to. Once it
              settles the endpoint will answer on{" "}
              <code className="font-mono text-[12px] text-fg">{plannedUrl}</code>.
              The request below is still generated from the model&apos;s real
              tensor signature — the send action turns on when the deployment
              goes live.
            </p>
          </div>
        </div>
      )}

      {live && degraded && (
        <div className="flex items-start gap-3 rounded-card border border-pending/25 bg-pending/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-pending" />
          <div className="min-w-0 text-[13px] leading-relaxed">
            <p className="font-medium text-fg">Deployment is degraded</p>
            <p className="mt-1 text-fg-muted">
              Not every one of the {desiredCount} Fargate task
              {desiredCount === 1 ? " is" : "s are"} passing its health check, so
              responses may be slow or intermittent. p95 is currently{" "}
              <span className="tnum">{formatLatency(p95LatencyMs)}</span>.
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------------- request */}
        <Card className="min-w-0">
          <CardHeader className="items-center">
            <div className="flex min-w-0 items-center gap-2.5">
              <Badge tone="accent" className="font-mono tracking-wide">
                POST
              </Badge>
              <code className="truncate font-mono text-[12.5px] text-fg">
                {predictPath}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBody(exampleBody);
                setParseError(null);
              }}
              disabled={!dirty}
            >
              <RotateCcw />
              Reset to example
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <Field
              label="API key"
              htmlFor="playground-key"
              hint={
                <>
                  Only the prefix is stored — the full key was shown once when it
                  was created.{" "}
                  <Link
                    href="/dashboard/api-keys"
                    className="text-fg-muted underline underline-offset-2 transition-colors hover:text-fg"
                  >
                    Manage keys
                  </Link>
                </>
              }
            >
              <Select
                id="playground-key"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className="font-mono text-[13px]"
              >
                {keys.map((k) => (
                  <option key={k.id} value={k.id} disabled={k.revoked}>
                    {k.name} · {k.keyPrefix}…{k.revoked ? " (revoked)" : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-fg">Headers</span>
                <span className="text-[11px] text-fg-subtle">
                  Set for you on every request
                </span>
              </div>
              <dl className="mt-1.5 overflow-hidden rounded-control border border-line bg-surface-2/40">
                {[
                  ["Content-Type", "application/json"],
                  [
                    "Authorization",
                    selectedKey
                      ? `Bearer ${selectedKey.keyPrefix}…`
                      : "Bearer —",
                  ],
                ].map(([name, value]) => (
                  <div
                    key={name}
                    className="flex items-baseline gap-3 border-b border-line px-3 py-2 last:border-0"
                  >
                    <dt className="w-28 shrink-0 font-mono text-[12px] text-fg-subtle">
                      {name}
                    </dt>
                    <dd className="min-w-0 truncate font-mono text-[12px] text-fg-muted">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <Field
              label="Request body"
              htmlFor="playground-body"
              error={parseError ?? undefined}
              hint="Long axes are elided as “… n more” so the example stays readable. The live endpoint expects every value."
            >
              <Textarea
                id="playground-body"
                value={body}
                spellCheck={false}
                aria-invalid={parseError ? true : undefined}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (parseError) setParseError(null);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                className="min-h-64 resize-y font-mono text-[12.5px] leading-[1.7]"
              />
            </Field>
          </CardContent>

          <CardFooter className="justify-between gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] text-fg-subtle sm:flex">
              <kbd className="rounded border border-line-strong bg-surface-3 px-1.5 py-px font-mono text-[10px]">
                ⌘
              </kbd>
              <kbd className="rounded border border-line-strong bg-surface-3 px-1.5 py-px font-mono text-[10px]">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              to send
            </span>
            <Button onClick={send} disabled={!live || pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Play />
                  Send request
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* ------------------------------------------------------ response */}
        <Card className="min-w-0">
          <CardHeader className="items-center">
            <div className="flex items-center gap-2.5">
              <CardTitle>Response</CardTitle>
              {response && (
                <Badge tone="live" className="font-mono">
                  {response.status} {response.statusText}
                </Badge>
              )}
              {pending && (
                <Badge tone="pending" className="font-mono">
                  pending
                </Badge>
              )}
            </div>
            {response && (
              <div className="flex shrink-0 items-center gap-2 text-[11px] tnum text-fg-subtle">
                <span>{formatLatency(response.latencyMs)}</span>
                <span>·</span>
                <span>{formatBytes(response.body.length)}</span>
              </div>
            )}
          </CardHeader>

          {response && (
            <Tabs
              tabs={[
                { id: "body", label: "Body" },
                { id: "headers", label: "Headers", count: response.headers.length },
              ]}
              active={responseTab}
              onChange={setResponseTab}
              className="px-5"
            />
          )}

          <CardContent className="min-h-72">
            {pending ? (
              <div className="space-y-2.5 py-1" aria-live="polite">
                <p className="text-[13px] text-fg-muted">
                  Waiting for {baseUrl.replace("https://", "")}…
                </p>
                {[92, 74, 84, 61].map((w) => (
                  <div
                    key={w}
                    className="h-3 animate-pulse-dot rounded bg-surface-3"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : response ? (
              responseTab === "body" ? (
                <pre className="overflow-x-auto">
                  <code className="font-mono text-[12.5px] leading-[1.7] text-fg-muted">
                    {response.body}
                  </code>
                </pre>
              ) : (
                <dl className="overflow-hidden rounded-control border border-line bg-surface-2/40">
                  {response.headers.map(([name, value]) => (
                    <div
                      key={name}
                      className="flex items-baseline gap-3 border-b border-line px-3 py-2 last:border-0"
                    >
                      <dt className="w-44 shrink-0 font-mono text-[12px] text-fg-subtle">
                        {name}
                      </dt>
                      <dd className="min-w-0 break-all font-mono text-[12px] text-fg-muted">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2">
                  <Terminal className="size-4 text-fg-subtle" />
                </div>
                <p className="text-[13px] font-medium text-fg">
                  {live ? "No request sent yet" : "Nothing to call yet"}
                </p>
                <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-fg-muted">
                  {live
                    ? `Send the request to see what the running task returns for ${outputName}.`
                    : `The response shape is already known — ${outputName} comes back from the model's output schema once the deployment is live.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --------------------------------------------------------- snippets */}
      <Card>
        <CardHeader className="items-center">
          <div className="min-w-0">
            <CardTitle>Call it from your code</CardTitle>
            <CardDescription>
              Generated from the request above — it changes as you edit the body
              or switch keys.
            </CardDescription>
          </div>
        </CardHeader>
        <Tabs
          tabs={SNIPPET_LANGUAGES.map((l) => ({ id: l.id, label: l.label }))}
          active={language}
          onChange={(id) => setLanguage(id as SnippetLanguage)}
          className="overflow-x-auto px-5"
        />
        <CardContent>
          <CodeBlock
            code={buildSnippet(language, {
              url: predictUrl,
              body,
              keyName: selectedKey?.name ?? "No active key",
              keyPrefix: selectedKey?.keyPrefix ?? "aeg_live_",
              outputName,
            })}
            filename={
              SNIPPET_LANGUAGES.find((l) => l.id === language)?.filename ??
              "predict.sh"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
