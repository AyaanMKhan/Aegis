import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileJson2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { EmptyState } from "@/components/ui/empty-state";
import { DetailRow } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { CodeSamples } from "@/components/playground/code-samples";
import {
  compactSignature,
  describeTensor,
  elementsPerItem,
  exampleRequestBody,
  exampleResponseBody,
  groupDigits,
  jsonTypeLabel,
  mismatchShape,
  renderJson,
} from "@/components/playground/schema-sample";
import { buildSnippet, SNIPPET_LANGUAGES } from "@/components/playground/snippets";
import {
  BASE_DOMAIN,
  getDeployment,
  MOCK_NOW,
  mockApiKeys,
  mockModelVersions,
} from "@/lib/mock-data";
import { formatShape } from "@/lib/format";
import type { TensorSpec } from "@/types/api";

type PageProps = { params: Promise<{ deploymentId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) return { title: "API docs" };
  return {
    title: `API docs · ${deployment.name}`,
    description: `Generated HTTP reference for ${deployment.name}, built from the ONNX tensor signature of ${deployment.modelName}:v${deployment.modelVersion}.`,
  };
}

/* ------------------------------------------------------ local page pieces */

const TOC: { id: string; label: string; children?: { id: string; label: string }[] }[] =
  [
    { id: "overview", label: "Overview" },
    { id: "authentication", label: "Authentication" },
    {
      id: "endpoints",
      label: "Endpoints",
      children: [
        { id: "post-predict", label: "POST /predict" },
        { id: "get-healthz", label: "GET /healthz" },
      ],
    },
    { id: "response-codes", label: "Response codes" },
    { id: "rate-limits", label: "Rate limits" },
    { id: "code-samples", label: "Code samples" },
  ];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-[15px] font-semibold tracking-tight text-fg">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

const methodTone: Record<string, React.ComponentProps<typeof Badge>["tone"]> = {
  GET: "info",
  POST: "accent",
  PUT: "pending",
  PATCH: "pending",
  DELETE: "failed",
};

function EndpointHeading({
  id,
  method,
  path,
  children,
}: {
  id: string;
  method: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-20">
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge tone={methodTone[method] ?? "neutral"} className="font-mono tracking-wide">
          {method}
        </Badge>
        <code className="break-all font-mono text-[13px] text-fg">{path}</code>
      </div>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
        {children}
      </p>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
      {children}
    </h4>
  );
}

/** Parameter table generated straight from the stored tensor schema. */
function TensorTable({
  specs,
  required,
}: {
  specs: TensorSpec[];
  required: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <THead>
          <TR className="hover:bg-transparent">
            <TH>Field</TH>
            <TH>JSON type</TH>
            <TH>Shape</TH>
            <TH>{required ? "Required" : "Presence"}</TH>
            <TH>Description</TH>
          </TR>
        </THead>
        <tbody>
          {specs.map((spec) => (
            <TR key={spec.name}>
              <TD className="whitespace-nowrap font-mono text-[12.5px] text-fg">
                {spec.name}
              </TD>
              <TD className="whitespace-nowrap font-mono text-[12px]">
                {jsonTypeLabel(spec)}
              </TD>
              <TD className="whitespace-nowrap font-mono text-[12px]">
                {formatShape(spec.shape)}
              </TD>
              <TD className="whitespace-nowrap text-[12.5px]">
                {required ? "Yes" : "Always"}
              </TD>
              <TD className="min-w-[20rem] text-[12.5px] leading-relaxed">
                {describeTensor(spec)}
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function CodeTable({
  rows,
}: {
  rows: { code: number; label: string; when: React.ReactNode }[];
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <THead>
          <TR className="hover:bg-transparent">
            <TH className="w-20">Code</TH>
            <TH className="w-56">Meaning</TH>
            <TH>Returned when</TH>
          </TR>
        </THead>
        <tbody>
          {rows.map((row) => (
            <TR key={row.code}>
              <TD className="font-mono text-[12.5px] tnum text-fg">{row.code}</TD>
              <TD className="whitespace-nowrap text-[12.5px]">{row.label}</TD>
              <TD className="text-[12.5px] leading-relaxed">{row.when}</TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

/* ------------------------------------------------------------------ page */

export default async function DeploymentDocsPage({ params }: PageProps) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) notFound();

  const version = mockModelVersions.find(
    (v) => v.id === deployment.modelVersionId,
  );
  if (!version) notFound();

  if (version.inputSchema.length === 0 || version.outputSchema.length === 0) {
    return (
      <EmptyState
        icon={FileJson2}
        title="Reference not generated yet"
        description={`These docs are generated from the tensor signature read off the ONNX graph at upload time. ${deployment.modelName}:v${version.version} is ${version.status}, so there is no signature to generate from.`}
      />
    );
  }

  const plannedBase = `https://${BASE_DOMAIN}/d/${deployment.slug}`;
  const baseUrl = deployment.endpointUrl ?? plannedBase;
  const predictUrl = `${baseUrl}/predict`;
  const modelLabel = `${deployment.modelName}:v${deployment.modelVersion}`;
  const requestBody = exampleRequestBody(version);
  const responseBody = exampleResponseBody(version);
  const firstInput = version.inputSchema[0];
  const firstOutput = version.outputSchema[0];
  const activeKey = mockApiKeys.find((k) => k.revokedAt === null);
  const uptimeSeconds = deployment.lastDeployedAt
    ? Math.round(
        (MOCK_NOW.getTime() - new Date(deployment.lastDeployedAt).getTime()) /
          1000,
      )
    : 0;
  const maxConcurrent = deployment.config.desiredCount * 4;

  const samples = SNIPPET_LANGUAGES.map((lang) => ({
    id: lang.id,
    label: lang.label,
    filename: lang.filename,
    code: buildSnippet(lang.id, {
      url: predictUrl,
      body: requestBody,
      keyName: activeKey?.name ?? "Production server",
      keyPrefix: activeKey?.keyPrefix ?? "aeg_live_",
      outputName: firstOutput.name,
    }),
  }));

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_10rem]">
      <div className="min-w-0 space-y-12">
        {/* ------------------------------------------------------ overview */}
        <Section
          id="overview"
          title="Overview"
          description={
            <>
              {deployment.name} serves{" "}
              <Link
                href={`/dashboard/models/${version.modelId}`}
                className="font-mono text-[12.5px] text-fg underline underline-offset-2 transition-colors hover:text-accent"
              >
                {modelLabel}
              </Link>
              . This reference is generated from that version&apos;s ONNX graph,
              read when the artifact was uploaded — the field names, shapes and
              dtypes below are the ones the running container accepts. Nothing
              here is written by hand, and it is regenerated whenever a new model
              version is deployed.
            </>
          }
        >
          {!deployment.endpointUrl && (
            <div className="flex items-start gap-3 rounded-card border border-pending/25 bg-pending/5 px-4 py-3.5">
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-pending" />
              <div className="min-w-0 text-[13px] leading-relaxed">
                <p className="font-medium text-fg">
                  The base URL below is not routable yet
                </p>
                <p className="mt-1 text-fg-muted">
                  This deployment is still being provisioned — the ALB listener
                  rule and target group do not exist, so every path in this
                  reference will fail to resolve until{" "}
                  <code className="font-mono text-[12px]">terraform apply</code>{" "}
                  finishes. The schema is already known, so the contract below is
                  final.
                </p>
              </div>
            </div>
          )}

          <Card className="px-5 py-1">
            <dl>
              <DetailRow label="Base URL" mono>
                <span className="inline-flex items-center gap-2">
                  {baseUrl}
                  {!deployment.endpointUrl && (
                    <Badge tone="pending">Not routable yet</Badge>
                  )}
                </span>
              </DetailRow>
              <DetailRow label="Content type" mono>
                application/json
              </DetailRow>
              <DetailRow label="Authentication" mono>
                Authorization: Bearer &lt;api-key&gt;
              </DetailRow>
              <DetailRow label="Model version" mono>
                {modelLabel}
              </DetailRow>
              <DetailRow label="Generated from" mono>
                {version.id} · {version.fileName}
              </DetailRow>
              <DetailRow label="Graph" mono>
                opset {version.opsetVersion ?? "—"} · producer{" "}
                {version.producerName ?? "unknown"}
              </DetailRow>
              <DetailRow label="Region" mono>
                {deployment.region}
              </DetailRow>
            </dl>
          </Card>
        </Section>

        {/* ------------------------------------------------ authentication */}
        <Section
          id="authentication"
          title="Authentication"
          description={
            <>
              Every request to <code className="font-mono text-[12px]">/predict</code>{" "}
              must carry an Aegis API key as a bearer token. Keys are account-wide
              — one key reaches every deployment you own.
            </>
          }
        >
          <CodeBlock
            language="http"
            copyable={false}
            code={`POST /d/${deployment.slug}/predict HTTP/1.1
Host: ${BASE_DOMAIN}
Authorization: Bearer ${activeKey?.keyPrefix ?? "aeg_live_"}…
Content-Type: application/json`}
          />

          <ul className="space-y-2 text-[13px] leading-relaxed text-fg-muted">
            <li className="flex gap-2.5">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
              <span>
                Create a key on{" "}
                <Link
                  href="/dashboard/api-keys"
                  className="text-fg underline underline-offset-2 transition-colors hover:text-accent"
                >
                  API keys
                </Link>
                . The full value is shown exactly once at creation — only a hash
                and the{" "}
                <code className="font-mono text-[12px]">
                  {activeKey?.keyPrefix ?? "aeg_live_"}
                </code>{" "}
                prefix are stored, so a lost key has to be rotated rather than
                recovered.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
              <span>
                Revoking a key takes effect on the next request; in-flight
                requests are not cancelled.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
              <span>
                <code className="font-mono text-[12px]">GET /healthz</code> is
                unauthenticated — it is the ALB target group health check and
                returns no model output.
              </span>
            </li>
          </ul>

          <div>
            <SubHeading>401 response</SubHeading>
            <CodeBlock
              className="mt-2"
              language="json"
              code={`HTTP/1.1 401 Unauthorized
content-type: application/json

${renderJson({
  error: "unauthorized",
  message: "API key is missing, malformed, or has been revoked.",
})}`}
            />
          </div>
        </Section>

        {/* ----------------------------------------------------- endpoints */}
        <Section
          id="endpoints"
          title="Endpoints"
          description={`Two paths are exposed per deployment, both routed by the shared ALB on the ${deployment.slug} path prefix.`}
        >
          <div className="space-y-5 rounded-card border border-line bg-surface px-5 py-5 raised">
            <EndpointHeading
              id="post-predict"
              method="POST"
              path={`/d/${deployment.slug}/predict`}
            >
              Runs one forward pass of {modelLabel}. The body is an object keyed
              by input tensor name; every tensor must be sent, and the leading
              axis is the batch dimension. The response is keyed by output tensor
              name in graph order.
            </EndpointHeading>

            <div>
              <SubHeading>Request body</SubHeading>
              <div className="mt-2">
                <TensorTable specs={version.inputSchema} required />
              </div>
            </div>

            <div>
              <SubHeading>Response body — 200</SubHeading>
              <div className="mt-2">
                <TensorTable specs={version.outputSchema} required={false} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-w-0">
                <SubHeading>Request example</SubHeading>
                <CodeBlock
                  className="mt-2"
                  filename="request.json"
                  code={requestBody}
                />
                <p className="mt-2 text-[12px] leading-relaxed text-fg-subtle">
                  Long axes are elided as{" "}
                  <code className="font-mono">&ldquo;… n more&rdquo;</code> so
                  the example stays readable. A real request carries every value
                  — <span className="tnum">{groupDigits(elementsPerItem(firstInput))}</span>{" "}
                  of them per batch item for{" "}
                  <code className="font-mono">{firstInput.name}</code>.
                </p>
              </div>
              <div className="min-w-0">
                <SubHeading>Response example</SubHeading>
                <CodeBlock
                  className="mt-2"
                  filename="200.json"
                  code={responseBody}
                />
                <p className="mt-2 text-[12px] leading-relaxed text-fg-subtle">
                  Tensors come back as nested arrays in the same order the graph
                  declares them:{" "}
                  <code className="font-mono">
                    {version.outputSchema.map((s) => s.name).join(", ")}
                  </code>
                  .
                </p>
              </div>
            </div>

            <div>
              <SubHeading>Response headers</SubHeading>
              <div className="mt-2">
                <Card className="overflow-hidden">
                  <Table>
                    <THead>
                      <TR className="hover:bg-transparent">
                        <TH className="w-64">Header</TH>
                        <TH>Value</TH>
                      </TR>
                    </THead>
                    <tbody>
                      {[
                        [
                          "x-aegis-request-id",
                          "Correlates the request with the Logs tab and the ApiRequest row.",
                        ],
                        [
                          "x-aegis-model",
                          `The model version that served it, e.g. ${modelLabel}.`,
                        ],
                        [
                          "x-aegis-latency-ms",
                          "Inference time inside the container, excluding network.",
                        ],
                        [
                          "x-ratelimit-remaining",
                          "Requests left in the current minute for this key.",
                        ],
                      ].map(([header, meaning]) => (
                        <TR key={header}>
                          <TD className="whitespace-nowrap font-mono text-[12px] text-fg">
                            {header}
                          </TD>
                          <TD className="text-[12.5px] leading-relaxed">
                            {meaning}
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-card border border-line bg-surface px-5 py-5 raised">
            <EndpointHeading
              id="get-healthz"
              method="GET"
              path={`/d/${deployment.slug}${deployment.config.healthCheckPath}`}
            >
              Liveness probe for the target group. Returns 200 once the
              onnxruntime session has loaded the artifact from S3 and is ready to
              serve; anything else takes the task out of rotation. No API key
              required.
            </EndpointHeading>

            <div>
              <SubHeading>Response example — 200</SubHeading>
              <CodeBlock
                className="mt-2"
                filename="healthz.json"
                code={renderJson({
                  status: "ok",
                  model: modelLabel,
                  opset: version.opsetVersion,
                  provider: "CPUExecutionProvider",
                  uptimeSeconds,
                })}
              />
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------ response codes */}
        <Section
          id="response-codes"
          title="Response codes"
          description={
            <>
              Errors are always JSON, with a stable machine-readable{" "}
              <code className="font-mono text-[12px]">error</code> field and a
              human message. The{" "}
              <code className="font-mono text-[12px]">requestId</code> in the body
              is the same id the Logs tab prints.
            </>
          }
        >
          <CodeTable
            rows={[
              {
                code: 200,
                label: "OK",
                when: "Inference completed. One entry per output tensor.",
              },
              {
                code: 400,
                label: "Bad Request",
                when: "The body is not valid JSON, or an input tensor named in the signature is missing.",
              },
              {
                code: 401,
                label: "Unauthorized",
                when: "The Authorization header is missing, malformed, or names a revoked key.",
              },
              {
                code: 422,
                label: "Unprocessable Entity",
                when: (
                  <>
                    A tensor parsed, but its shape or dtype does not match the
                    model signature — e.g.{" "}
                    <code className="font-mono text-[12px]">
                      {mismatchShape(firstInput)}
                    </code>{" "}
                    against{" "}
                    <code className="font-mono text-[12px]">
                      {compactSignature(firstInput.shape)}
                    </code>
                    .
                  </>
                ),
              },
              {
                code: 429,
                label: "Too Many Requests",
                when: "The per-key rate limit is exhausted. Retry after the interval in the retry-after header.",
              },
              {
                code: 503,
                label: "Service Unavailable",
                when: "The deployment is not live — no healthy Fargate task is registered with the target group.",
              },
            ]}
          />

          <div>
            <SubHeading>422 response</SubHeading>
            <CodeBlock
              className="mt-2"
              language="json"
              code={renderJson({
                error: "shape_mismatch",
                message: `input "${firstInput.name}": shape ${mismatchShape(
                  firstInput,
                )} does not match ${compactSignature(firstInput.shape)}`,
                expected: {
                  name: firstInput.name,
                  shape: compactSignature(firstInput.shape),
                  dtype: firstInput.dtype,
                },
                requestId: "req_1f9e3c",
              })}
            />
          </div>

          <div>
            <SubHeading>400 response</SubHeading>
            <CodeBlock
              className="mt-2"
              language="json"
              code={renderJson({
                error: "invalid_json",
                message: "Expecting ',' delimiter: line 4 column 9 (char 118)",
                requestId: "req_0b52d7",
              })}
            />
          </div>
        </Section>

        {/* ---------------------------------------------------- rate limits */}
        <Section
          id="rate-limits"
          title="Rate limits"
          description="Limits are counted per API key, not per deployment, and are returned on every response so a client can back off before it is throttled."
        >
          <Card className="overflow-hidden">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="w-64">Header</TH>
                  <TH className="w-28">Example</TH>
                  <TH>Meaning</TH>
                </TR>
              </THead>
              <tbody>
                {[
                  ["x-ratelimit-limit", "600", "Requests allowed per minute for this key."],
                  ["x-ratelimit-remaining", "597", "Requests left in the current window."],
                  [
                    "x-ratelimit-reset",
                    "41",
                    "Seconds until the window resets.",
                  ],
                  [
                    "retry-after",
                    "41",
                    "Sent only with a 429. Wait this many seconds before retrying.",
                  ],
                ].map(([header, example, meaning]) => (
                  <TR key={header}>
                    <TD className="whitespace-nowrap font-mono text-[12px] text-fg">
                      {header}
                    </TD>
                    <TD className="font-mono text-[12px] tnum">{example}</TD>
                    <TD className="text-[12.5px] leading-relaxed">{meaning}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>

          <p className="max-w-2xl text-[13px] leading-relaxed text-fg-muted">
            Beyond the key limit, throughput is bounded by this deployment&apos;s
            own capacity: {deployment.config.desiredCount} Fargate task
            {deployment.config.desiredCount === 1 ? "" : "s"} at{" "}
            {deployment.config.cpu / 1024} vCPU, scaling to{" "}
            {deployment.config.maxCapacity}, which is roughly {maxConcurrent}{" "}
            concurrent inferences. Requests queue at the target group and are cut
            off at {deployment.config.requestTimeoutSeconds}s with a 504.
          </p>
        </Section>

        {/* --------------------------------------------------- code samples */}
        <Section
          id="code-samples"
          title="Code samples"
          description={
            <>
              Copy-paste clients for{" "}
              <code className="font-mono text-[12px]">
                POST /d/{deployment.slug}/predict
              </code>
              , generated with the same example body as above. Each reads the key
              from{" "}
              <code className="font-mono text-[12px]">AEGIS_API_KEY</code> —
              never hard-code it, since the value cannot be read back from Aegis.
            </>
          }
        >
          <CodeSamples samples={samples} />
        </Section>
      </div>

      {/* ---------------------------------------------------------- on-page */}
      <aside className="hidden xl:block">
        <nav
          aria-label="On this page"
          className="sticky top-20 border-l border-line"
        >
          <p className="pl-3 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
            On this page
          </p>
          <ul className="mt-3 space-y-1.5">
            {TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block py-0.5 pl-3 text-[12.5px] text-fg-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </a>
                {item.children && (
                  <ul className="mt-1.5 space-y-1.5">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <a
                          href={`#${child.id}`}
                          className="block py-0.5 pl-6 font-mono text-[11.5px] text-fg-subtle transition-colors hover:text-fg"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
