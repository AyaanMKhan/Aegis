import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  FileWarning,
  Loader2,
  Rocket,
  Upload,
} from "lucide-react";
import { Badge, ModelStatusBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DetailRow } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import {
  ChecksumValue,
  SignatureSkeleton,
  SignatureTables,
} from "@/components/models/signature";
import {
  MOCK_NOW,
  getModel,
  getProject,
  getVersionsForModel,
  mockDeployments,
} from "@/lib/mock-data";
import {
  formatBytes,
  formatDate,
  formatRelativeTime,
} from "@/lib/format";
import type { ModelVersion } from "@/types/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modelId: string }>;
}): Promise<Metadata> {
  const { modelId } = await params;
  const model = getModel(modelId);
  if (!model) return { title: "Model not found" };
  return {
    title: model.name,
    description:
      model.description ??
      `Versions, signature and deployments for ${model.name}.`,
  };
}

/** An em dash that reads as "the graph has not told us yet". */
function Pending({ note }: { note?: string }) {
  return (
    <span className="text-fg-subtle">
      —{note && <span className="ml-2 text-[11px]">{note}</span>}
    </span>
  );
}

function deployHref(version: ModelVersion): string {
  return `/dashboard/deployments/new?modelVersionId=${version.id}`;
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = getModel(modelId);
  if (!model) notFound();

  const project = getProject(model.projectId);
  const versions = [...getVersionsForModel(model.id)].sort(
    (a, b) => b.version - a.version,
  );
  const latest = versions[0] ?? null;
  const deployable = versions.find((v) => v.status === "ready") ?? null;
  const failedLatest = latest && latest.status === "failed" ? latest : null;
  const settling =
    latest && (latest.status === "inspecting" || latest.status === "uploading")
      ? latest
      : null;

  const versionIds = new Set(versions.map((v) => v.id));
  const deployments = mockDeployments.filter((d) =>
    versionIds.has(d.modelVersionId),
  );
  const deployedVersionIds = new Set(deployments.map((d) => d.modelVersionId));

  const uploadHref = `/dashboard/projects/${model.projectId}/models/new`;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/dashboard/projects" },
          ...(project
            ? [{ label: project.name, href: `/dashboard/projects/${project.id}` }]
            : []),
          { label: model.name },
        ]}
        title={model.name}
        badge={latest ? <ModelStatusBadge status={latest.status} /> : null}
        description={model.description ?? undefined}
        actions={
          <>
            <ButtonLink href={uploadHref} variant="secondary" size="sm">
              <Upload className="size-4" />
              Upload new version
            </ButtonLink>
            {deployable && (
              <ButtonLink href={deployHref(deployable)} size="sm">
                <Rocket className="size-4" />
                Deploy
              </ButtonLink>
            )}
          </>
        }
      />

      {/* The Model / ModelVersion split, said out loud. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-fg-subtle">
        <span className="font-mono">{model.id}</span>
        <span aria-hidden="true">·</span>
        <span className="tnum">
          {versions.length} {versions.length === 1 ? "version" : "versions"}
        </span>
        {latest && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              latest <span className="font-mono text-fg-muted">v{latest.version}</span>{" "}
              uploaded {formatRelativeTime(latest.createdAt, MOCK_NOW)}
            </span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span>created {formatDate(model.createdAt)}</span>
      </div>

      {failedLatest?.errorMessage && (
        <section
          id="inspection-error"
          className="scroll-mt-20 rounded-card border border-failed/25 bg-failed/10 p-4"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-failed" />
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-failed">
                Version {failedLatest.version} failed inspection
              </h2>
              <p className="mt-1.5 font-mono text-[12.5px] leading-relaxed text-failed/90">
                {failedLatest.errorMessage}
              </p>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
                The artifact is in S3 but no signature was extracted, so this
                version cannot be deployed. Re-export{" "}
                <span className="font-mono">{failedLatest.fileName}</span> against
                opset 18 or lower and upload it as a new version.
              </p>
              <div className="mt-3.5">
                <ButtonLink href={uploadHref} variant="secondary" size="sm">
                  <Upload className="size-4" />
                  Upload a corrected version
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ------------------------------------------------- signature */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Signature</CardTitle>
              <CardDescription>
                {deployable
                  ? "The tensors the generated OpenAPI schema is built from."
                  : "Read off the ONNX graph once inspection completes."}
              </CardDescription>
            </div>
            {deployable && (
              <Badge tone="neutral" className="font-mono">
                v{deployable.version}
              </Badge>
            )}
          </CardHeader>

          {deployable ? (
            <SignatureTables
              inputs={deployable.inputSchema}
              outputs={deployable.outputSchema}
            />
          ) : settling ? (
            <CardContent className="space-y-4">
              <p className="flex items-center gap-2 text-[13px] text-fg-muted">
                <Loader2 className="size-3.5 animate-spin text-pending" />
                Inspecting the graph — tensor names, shapes and dtypes appear as
                soon as the parse completes.
              </p>
              <SignatureSkeleton />
              <p className="text-[12px] text-fg-subtle">
                Started {formatRelativeTime(settling.createdAt, MOCK_NOW)} ·{" "}
                <span className="font-mono">{settling.fileName}</span> ·{" "}
                <span className="tnum">{formatBytes(settling.fileSize)}</span>
              </p>
            </CardContent>
          ) : (
            <CardContent>
              <EmptyState
                icon={FileWarning}
                title="No signature yet"
                description="No version of this model has completed graph inspection, so there are no tensors to show."
                action={
                  <ButtonLink href={uploadHref} variant="secondary" size="sm">
                    <Upload className="size-4" />
                    Upload a version
                  </ButtonLink>
                }
              />
            </CardContent>
          )}
        </Card>

        {/* -------------------------------------------------- metadata */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Artifact</CardTitle>
              <CardDescription>
                {latest ? `Version ${latest.version}` : "No versions yet"}
              </CardDescription>
            </div>
            {latest && <ModelStatusBadge status={latest.status} />}
          </CardHeader>
          <CardContent>
            {latest ? (
              <dl>
                <DetailRow label="Framework">
                  {latest.framework ?? <Pending note="from producer_name" />}
                </DetailRow>
                <DetailRow label="Producer" mono>
                  {latest.producerName ?? <Pending />}
                </DetailRow>
                <DetailRow label="Opset version">
                  {latest.opsetVersion !== null ? (
                    <span className="tnum">{latest.opsetVersion}</span>
                  ) : (
                    <Pending />
                  )}
                </DetailRow>
                <DetailRow label="File size">
                  <span className="tnum">{formatBytes(latest.fileSize)}</span>
                </DetailRow>
                <DetailRow label="File name" mono>
                  {latest.fileName}
                </DetailRow>
                <DetailRow label="Checksum">
                  {latest.checksum ? (
                    <ChecksumValue value={latest.checksum} />
                  ) : (
                    <Pending note="computed during inspection" />
                  )}
                </DetailRow>
                <DetailRow label="Storage path" mono>
                  {latest.storagePath}
                </DetailRow>
                <DetailRow label="Uploaded">
                  {formatDate(latest.createdAt)}
                  <span className="ml-2 text-fg-subtle">
                    {formatRelativeTime(latest.createdAt, MOCK_NOW)}
                  </span>
                </DetailRow>
              </dl>
            ) : (
              <p className="text-[13px] text-fg-muted">
                Upload an <span className="font-mono">.onnx</span> file to create
                the first version.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --------------------------------------------------- versions */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Versions</CardTitle>
            <CardDescription>
              Every upload becomes an immutable version. A deployment pins one, so
              shipping a new build is always an explicit step.
            </CardDescription>
          </div>
          <span className="rounded-full border border-line-strong bg-surface-2 px-2 py-0.5 text-[11px] tnum text-fg-muted">
            {versions.length}
          </span>
        </CardHeader>

        <Table>
          <THead>
            <tr>
              <TH>Version</TH>
              <TH>Status</TH>
              <TH>Framework</TH>
              <TH className="text-right">Opset</TH>
              <TH className="text-right">Size</TH>
              <TH>Created</TH>
              <TH className="text-right">Action</TH>
            </tr>
          </THead>
          <tbody>
            {versions.map((version) => {
              const isDeployed = deployedVersionIds.has(version.id);
              const isLatest = latest?.id === version.id;
              return (
                <TR key={version.id}>
                  <TD className="whitespace-nowrap">
                    <span className="font-mono text-[13px] text-fg">
                      v{version.version}
                    </span>
                    {isDeployed && (
                      <Badge tone="accent" className="ml-2">
                        Deployed
                      </Badge>
                    )}
                    {isLatest && !isDeployed && (
                      <Badge tone="neutral" className="ml-2">
                        Latest
                      </Badge>
                    )}
                  </TD>
                  <TD>
                    <ModelStatusBadge status={version.status} />
                  </TD>
                  <TD className="whitespace-nowrap">
                    {version.framework ?? <Pending />}
                  </TD>
                  <TD className="text-right tnum">
                    {version.opsetVersion ?? <Pending />}
                  </TD>
                  <TD className="whitespace-nowrap text-right tnum">
                    {formatBytes(version.fileSize)}
                  </TD>
                  <TD className="whitespace-nowrap">
                    {formatRelativeTime(version.createdAt, MOCK_NOW)}
                  </TD>
                  <TD className="text-right">
                    {version.status === "ready" ? (
                      <ButtonLink
                        href={deployHref(version)}
                        variant="ghost"
                        size="sm"
                      >
                        Deploy
                      </ButtonLink>
                    ) : version.status === "failed" ? (
                      <a
                        href="#inspection-error"
                        className="inline-flex h-8 items-center rounded-control px-3 text-[13px] text-failed transition-colors hover:bg-failed/10"
                      >
                        View error
                      </a>
                    ) : (
                      <span className="inline-flex h-8 items-center px-3 text-[13px] text-fg-subtle">
                        {version.status === "uploading"
                          ? "Uploading…"
                          : "Inspecting…"}
                      </span>
                    )}
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>

        <CardFooter className="justify-between">
          <p className="text-[11px] text-fg-subtle">
            Stored under{" "}
            <span className="font-mono">
              s3://aegis-models/{model.projectId}/{model.id}/
            </span>
          </p>
          <ButtonLink href={uploadHref} variant="secondary" size="sm">
            <Upload className="size-4" />
            Upload new version
          </ButtonLink>
        </CardFooter>
      </Card>

      {/* ------------------------------------------------ deployments */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Deployments using this model</CardTitle>
            <CardDescription>
              Each one is an ECS Fargate service behind the shared ALB, pinned to a
              single version.
            </CardDescription>
          </div>
        </CardHeader>

        {deployments.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={Rocket}
              title="Not deployed yet"
              description={
                deployable
                  ? `Deploying v${deployable.version} provisions a Fargate service and an ALB rule, and returns an HTTPS endpoint secured by an API key.`
                  : "No version has passed inspection, so there is nothing to deploy yet."
              }
              action={
                deployable ? (
                  <ButtonLink href={deployHref(deployable)} size="sm">
                    <Rocket className="size-4" />
                    Deploy v{deployable.version}
                  </ButtonLink>
                ) : undefined
              }
            />
          </CardContent>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Deployment</TH>
                <TH>Status</TH>
                <TH>Version</TH>
                <TH>Endpoint</TH>
                <TH>Last deployed</TH>
                <TH className="w-10" />
              </tr>
            </THead>
            <tbody>
              {deployments.map((deployment) => (
                <TR key={deployment.id}>
                  <TD>
                    <Link
                      href={`/dashboard/deployments/${deployment.id}`}
                      className="text-[13px] font-medium text-fg transition-colors hover:text-accent"
                    >
                      {deployment.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      {deployment.region}
                    </p>
                  </TD>
                  <TD>
                    <StatusBadge status={deployment.status} />
                  </TD>
                  <TD className="font-mono text-[12.5px]">
                    v{deployment.modelVersion}
                  </TD>
                  <TD className="font-mono text-[12px]">
                    {deployment.endpointUrl ? (
                      deployment.endpointUrl.replace("https://", "")
                    ) : (
                      <Pending note="awaiting ALB rule" />
                    )}
                  </TD>
                  <TD className="whitespace-nowrap">
                    {deployment.lastDeployedAt ? (
                      formatRelativeTime(deployment.lastDeployedAt, MOCK_NOW)
                    ) : (
                      <Pending />
                    )}
                  </TD>
                  <TD className="text-right">
                    <Link
                      href={`/dashboard/deployments/${deployment.id}`}
                      aria-label={`Open ${deployment.name}`}
                      className="inline-flex size-7 items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}

        {deployments.length > 0 && deployable && (
          <CardFooter>
            <ButtonLink
              href={deployHref(deployable)}
              variant="secondary"
              size="sm"
            >
              New deployment
              <ArrowRight className="size-4" />
            </ButtonLink>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
