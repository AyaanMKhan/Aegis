import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plus, TerminalSquare } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaChart, Sparkline } from "@/components/ui/chart";
import { CodeBlock } from "@/components/ui/code-block";
import { DetailRow, Stat } from "@/components/ui/stat";
import { DeploymentActivity } from "@/components/deployments/deployment-activity";
import { HealthBanner } from "@/components/deployments/health-banner";
import { InfrastructurePanel } from "@/components/deployments/infrastructure-panel";
import { ProvisioningPanel } from "@/components/deployments/provisioning-panel";
import { buildCurl } from "@/components/deployments/sample-request";
import {
  formatBytes,
  formatLatency,
  formatNumber,
  formatPercent,
  formatShape,
} from "@/lib/format";
import {
  BASE_DOMAIN,
  getDeployment,
  getEventsForDeployment,
  getMetrics,
  mockApiKeys,
  mockLogs,
  mockModelVersions,
} from "@/lib/mock-data";

type Props = { params: Promise<{ deploymentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) return { title: "Deployment not found" };

  return {
    title: deployment.name,
    description: `${deployment.modelName}:v${deployment.modelVersion} on ECS Fargate in ${deployment.region} — endpoint, infrastructure handles and traffic.`,
  };
}

export default async function DeploymentOverviewPage({ params }: Props) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  // The layout already 404s, but this page reads the row itself.
  if (!deployment) notFound();

  const metrics = getMetrics(deployment.id);
  const events = getEventsForDeployment(deployment.id);
  const version = mockModelVersions.find(
    (v) => v.id === deployment.modelVersionId,
  );

  const settled = deployment.endpointUrl !== null && metrics.requestsTotal > 0;
  const requests48h = metrics.requests.reduce((sum, p) => sum + p.value, 0);
  const peak = Math.max(...metrics.requests.map((p) => p.value));
  const failedRequests = Math.round(metrics.requestsTotal * metrics.errorRate);
  const tailRatio = metrics.p50LatencyMs
    ? metrics.p95LatencyMs / metrics.p50LatencyMs
    : 0;

  // mockLogs is the resnet50-prod log group; never attribute it elsewhere.
  const logs = deployment.id === "dep_resnet_prod" ? mockLogs : [];

  const activeKey = mockApiKeys.find((k) => k.revokedAt === null);
  const endpoint =
    deployment.endpointUrl ?? `https://${BASE_DOMAIN}/d/${deployment.slug}`;
  const curl = buildCurl({
    endpointUrl: endpoint,
    keyPrefix: activeKey?.keyPrefix ?? "aeg_live",
    inputs: version?.inputSchema ?? [],
  });

  const envEntries = Object.entries(deployment.config.environment);
  const root = `/dashboard/deployments/${deployment.id}`;

  return (
    <div className="space-y-6">
      <HealthBanner deployment={deployment} metrics={metrics} />

      {settled ? (
        <>
          {/* ------------------------------------------------------- KPIs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Requests"
              value={formatNumber(metrics.requestsTotal)}
              footnote={`${formatNumber(requests48h)} in the last 48h`}
              chart={
                <Sparkline
                  data={metrics.requests}
                  label={`Hourly requests to ${deployment.name} over the last 48 hours`}
                />
              }
            />
            <Stat
              label="Error rate"
              value={formatPercent(metrics.errorRate)}
              invertDelta
              footnote={`${formatNumber(failedRequests)} failed requests since first deploy`}
            />
            <Stat
              label="p50 latency"
              value={formatLatency(metrics.p50LatencyMs)}
              footnote="Median, measured at the gateway"
            />
            <Stat
              label="p95 latency"
              value={formatLatency(metrics.p95LatencyMs)}
              invertDelta
              footnote={`${tailRatio.toFixed(1)}× the median`}
            />
          </div>

          {/* ---------------------------------------------------- traffic */}
          <Card>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>Requests per hour · {deployment.name}</CardTitle>
                <CardDescription>
                  Counted at the gateway, hourly, last 48 hours.
                </CardDescription>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[11px] uppercase tracking-wider text-fg-subtle">
                  Peak
                </div>
                <div className="text-[13px] tnum text-fg">
                  {formatNumber(peak)}
                  <span className="text-fg-muted"> /hr</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={metrics.requests}
                title={`Requests per hour to ${deployment.name}`}
                valueFormat={(v) => formatNumber(Math.round(v))}
                xLabels={["48h ago", "now"]}
              />
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-[11px] text-fg-subtle">
                Latency percentiles and status-code breakdown on Monitoring.
              </span>
              <ButtonLink href={`${root}/monitoring`} variant="ghost" size="sm">
                Open monitoring
                <ArrowRight className="size-3.5" />
              </ButtonLink>
            </CardFooter>
          </Card>
        </>
      ) : (
        <ProvisioningPanel deployment={deployment} events={events} />
      )}

      {/* ------------------------------------ infrastructure + model panel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <InfrastructurePanel deployment={deployment} className="lg:col-span-2" />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>Served model</CardTitle>
                <CardDescription>
                  The artifact the runner pulls from S3 at boot.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="py-1">
              <dl>
                <DetailRow label="Version">
                  <Link
                    href={`/dashboard/models/${version?.modelId ?? ""}`}
                    className="font-mono text-[12px] transition-colors hover:text-accent"
                  >
                    {deployment.modelName}:v{deployment.modelVersion}
                  </Link>
                </DetailRow>
                <DetailRow label="Framework">
                  {version?.framework ?? "Unknown"}
                  {version?.opsetVersion != null && (
                    <span className="ml-1.5 text-fg-subtle tnum">
                      · opset {version.opsetVersion}
                    </span>
                  )}
                </DetailRow>
                <DetailRow label="Artifact" mono>
                  {version?.fileName ?? "—"}
                </DetailRow>
                <DetailRow label="Size">
                  <span className="tnum">
                    {version ? formatBytes(version.fileSize) : "—"}
                  </span>
                </DetailRow>
                {version?.inputSchema.map((t) => (
                  <DetailRow key={`in-${t.name}`} label={`Input · ${t.name}`} mono>
                    {formatShape(t.shape)} {t.dtype}
                  </DetailRow>
                ))}
                {version?.outputSchema.map((t) => (
                  <DetailRow
                    key={`out-${t.name}`}
                    label={`Output · ${t.name}`}
                    mono
                  >
                    {formatShape(t.shape)} {t.dtype}
                  </DetailRow>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>Environment</CardTitle>
                <CardDescription>
                  Injected into the task definition on the next apply.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className={envEntries.length > 0 ? "py-1" : undefined}>
              {envEntries.length > 0 ? (
                <dl>
                  {envEntries.map(([key, value]) => (
                    <DetailRow key={key} label={key} mono>
                      {value}
                    </DetailRow>
                  ))}
                </dl>
              ) : (
                <div className="space-y-3">
                  <p className="text-[13px] leading-relaxed text-fg-muted">
                    No variables set. The runner only needs{" "}
                    <span className="font-mono text-[12px]">MODEL_S3_URI</span>,
                    which Terraform writes into the task definition itself.
                  </p>
                  <ButtonLink
                    href={`${root}/configure`}
                    variant="secondary"
                    size="sm"
                  >
                    <Plus className="size-4" />
                    Add a variable
                  </ButtonLink>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------- quick call + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Call this deployment</CardTitle>
              <CardDescription>
                Body shaped from the deployed version&apos;s ONNX input
                signature.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <CodeBlock code={curl} language="bash" />
            <p className="text-[12px] leading-relaxed text-fg-subtle">
              {deployment.endpointUrl ? (
                <>
                  Swap in a full key — Aegis stores only the prefix{" "}
                  <span className="font-mono">{activeKey?.keyPrefix}</span>, so
                  the rest is shown once at creation.
                </>
              ) : (
                <>
                  This URL is reserved but not routable yet. The ALB rule for{" "}
                  <span className="font-mono">/d/{deployment.slug}</span> is
                  created by the apply that is still running.
                </>
              )}
            </p>
          </CardContent>
          <CardFooter className="justify-between">
            <ButtonLink href="/dashboard/api-keys" variant="ghost" size="sm">
              Manage API keys
            </ButtonLink>
            {deployment.endpointUrl ? (
              <ButtonLink href={`${root}/test`} variant="secondary" size="sm">
                <TerminalSquare className="size-4" />
                Open playground
              </ButtonLink>
            ) : (
              <span className="text-[11px] text-fg-subtle">
                Playground unlocks when the service goes live
              </span>
            )}
          </CardFooter>
        </Card>

        <DeploymentActivity
          deployment={deployment}
          events={events}
          logs={logs}
        />
      </div>
    </div>
  );
}
