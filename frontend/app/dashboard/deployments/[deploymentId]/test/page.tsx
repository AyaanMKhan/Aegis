import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaygroundConsole } from "@/components/playground/playground-console";
import {
  exampleRequestBody,
  exampleResponseBody,
} from "@/components/playground/schema-sample";
import {
  BASE_DOMAIN,
  getDeployment,
  getMetrics,
  mockApiKeys,
  mockModelVersions,
} from "@/lib/mock-data";

type PageProps = { params: Promise<{ deploymentId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) return { title: "Playground" };
  return {
    title: `Playground · ${deployment.name}`,
    description: `Send a test request to ${deployment.name} and generate client code from the ONNX tensor signature of ${deployment.modelName}:v${deployment.modelVersion}.`,
  };
}

export default async function DeploymentPlaygroundPage({ params }: PageProps) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) notFound();

  const version = mockModelVersions.find(
    (v) => v.id === deployment.modelVersionId,
  );
  if (!version) notFound();

  if (version.inputSchema.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No tensor signature yet"
        description={`The playground is generated from the input and output tensors read off the ONNX graph. ${deployment.modelName}:v${version.version} is ${version.status}, so there is no signature to build a request from.`}
      />
    );
  }

  const metrics = getMetrics(deployment.id);
  const runnerTag =
    deployment.config.containerImage.split(":").pop() ?? "latest";

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-[13px] leading-relaxed text-fg-muted">
        Requests are signed with one of your API keys and sent to{" "}
        <code className="font-mono text-[12px] text-fg">
          /d/{deployment.slug}/predict
        </code>{" "}
        on the shared ALB, which routes them to this deployment&apos;s Fargate
        tasks. The body below is generated from the tensor signature of{" "}
        <code className="font-mono text-[12px] text-fg">
          {deployment.modelName}:v{deployment.modelVersion}
        </code>
        , so it already matches what the runner will accept.
      </p>

      <PlaygroundConsole
        endpointUrl={deployment.endpointUrl}
        plannedUrl={`https://${BASE_DOMAIN}/d/${deployment.slug}`}
        slug={deployment.slug}
        modelLabel={`${deployment.modelName}:v${deployment.modelVersion}`}
        runnerTag={runnerTag}
        degraded={deployment.status === "degraded"}
        desiredCount={deployment.config.desiredCount}
        exampleBody={exampleRequestBody(version)}
        exampleResponse={exampleResponseBody(version)}
        outputName={version.outputSchema[0]?.name ?? "output"}
        p50LatencyMs={metrics.p50LatencyMs || 24}
        p95LatencyMs={metrics.p95LatencyMs || 48}
        keys={mockApiKeys.map((key) => ({
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          revoked: key.revokedAt !== null,
        }))}
      />
    </div>
  );
}
