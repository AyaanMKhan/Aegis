import type { Metadata } from "next";
import {
  BASE_DOMAIN,
  getModel,
  getProject,
  mockModelVersions,
} from "@/lib/mock-data";
import { PageHeader } from "@/components/ui/page-header";
import {
  NewDeploymentForm,
  type DeployableVersion,
} from "@/components/deployments/new-deployment-form";

export const metadata: Metadata = { title: "New deployment" };

/** Every inspected version, flattened with the names the form needs to show. */
function deployableVersions(): DeployableVersion[] {
  return mockModelVersions
    .filter((v) => v.status === "ready")
    .map((v) => {
      const model = getModel(v.modelId);
      const project = model ? getProject(model.projectId) : undefined;
      return {
        versionId: v.id,
        modelId: v.modelId,
        modelName: model?.name ?? v.modelId,
        projectId: model?.projectId ?? "",
        projectName: project?.name ?? "Unknown project",
        version: v.version,
        framework: v.framework,
        fileSize: v.fileSize,
      };
    });
}

export default async function NewDeploymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.modelVersionId;
  const requested = Array.isArray(raw) ? raw[0] : raw;

  const versions = deployableVersions();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Deployments", href: "/dashboard/deployments" },
          { label: "New deployment" },
        ]}
        title="New deployment"
        description="Pin a model version to its own ECS Fargate service, routed by path through the shared ALB."
      />
      <NewDeploymentForm
        versions={versions}
        baseDomain={BASE_DOMAIN}
        initialVersionId={requested ?? null}
      />
    </div>
  );
}
