import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boxes, Rocket, Upload } from "lucide-react";
import {
  MOCK_NOW,
  getDeploymentsForProject,
  getModelsForProject,
  getProject,
} from "@/lib/mock-data";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectDeploymentsTable } from "@/components/projects/project-deployments-table";
import { ProjectModelsTable } from "@/components/projects/project-models-table";

type Params = { params: Promise<{ projectId: string }> };

/** Only us-east-1 is provisioned — the baseline lives in a single region. */
const PROJECT_REGION = "us-east-1";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) return { title: "Project not found" };
  return {
    title: project.name,
    description:
      project.description ??
      `Models and deployments in the ${project.name} project.`,
  };
}

function SectionHeading({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium tracking-tight text-fg">{title}</h2>
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] tnum text-fg-subtle">
          {count}
        </span>
      </div>
      {action}
    </div>
  );
}

export default async function ProjectOverviewPage({ params }: Params) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) notFound();

  const models = getModelsForProject(project.id);
  const deployments = getDeploymentsForProject(project.id);
  const uploadHref = `/dashboard/projects/${project.id}/models/new`;
  // A deployment is created from a ready model version, so that is where the
  // secondary action leads. With nothing ready there is nothing to deploy.
  const deployable = models.find((m) => m.latestVersion?.status === "ready");

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/dashboard/projects" },
          { label: project.name },
        ]}
        title={project.name}
        description={
          project.description ?? "No description yet for this project."
        }
        actions={
          <>
            {deployable ? (
              <ButtonLink
                href={`/dashboard/deployments/new?modelVersionId=${deployable.latestVersion?.id ?? ""}`}
                variant="secondary"
                size="sm"
              >
                <Rocket />
                New deployment
              </ButtonLink>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled
                title="Upload a model version before deploying"
              >
                <Rocket />
                New deployment
              </Button>
            )}
            <ButtonLink href={uploadHref} size="sm">
              <Upload />
              Upload model
            </ButtonLink>
          </>
        }
      />

      {/* -------------------------------------------------------- meta strip */}
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2.5 rounded-card border border-line bg-surface px-4 py-3 raised text-[12px]">
        <div className="flex items-center gap-2">
          <dt className="text-fg-subtle">Slug</dt>
          <dd className="font-mono text-fg">{project.slug}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-fg-subtle">Created</dt>
          <dd className="text-fg-muted">{formatDate(project.createdAt)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-fg-subtle">Region</dt>
          <dd className="font-mono text-fg-muted">{PROJECT_REGION}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-fg-subtle">Updated</dt>
          <dd className="tnum text-fg-muted">
            {formatRelativeTime(project.updatedAt, MOCK_NOW)}
          </dd>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <dt className="text-fg-subtle">Project ID</dt>
          <dd className="flex items-center gap-1.5">
            <span className="font-mono text-fg">{project.id}</span>
            <CopyButton value={project.id} />
          </dd>
        </div>
      </dl>

      {/* ------------------------------------------------------------ models */}
      <section className="space-y-3">
        <SectionHeading
          title="Models"
          count={models.length}
          action={
            models.length > 0 ? (
              <ButtonLink href={uploadHref} variant="secondary" size="sm">
                <Upload />
                Upload model
              </ButtonLink>
            ) : undefined
          }
        />
        {models.length > 0 ? (
          <Card className="overflow-hidden">
            <ProjectModelsTable models={models} />
          </Card>
        ) : (
          <EmptyState
            icon={Boxes}
            title="No models yet"
            description="Upload an .onnx file and Aegis reads the graph for you — producer, opset, checksum and every input and output tensor. Each upload becomes its own version."
            action={
              <ButtonLink href={uploadHref} size="sm">
                <Upload />
                Upload model
              </ButtonLink>
            }
          />
        )}
      </section>

      {/* ------------------------------------------------------- deployments */}
      <section className="space-y-3">
        <SectionHeading title="Deployments" count={deployments.length} />
        {deployments.length > 0 ? (
          <Card className="overflow-hidden">
            <ProjectDeploymentsTable deployments={deployments} />
          </Card>
        ) : (
          <EmptyState
            icon={Rocket}
            title="No deployments yet"
            description={
              models.length > 0
                ? "Deploy a ready model version to run terraform apply: a task definition, Fargate service, target group and an HTTPS rule on the shared ALB."
                : "Deployments are created from a model version, so start with an upload above. Deploying then runs terraform apply to create a Fargate service and an HTTPS rule on the shared ALB."
            }
            action={
              deployable ? (
                <ButtonLink
                  href={`/dashboard/deployments/new?modelVersionId=${deployable.latestVersion?.id ?? ""}`}
                  variant="secondary"
                  size="sm"
                >
                  <Rocket />
                  New deployment
                </ButtonLink>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
