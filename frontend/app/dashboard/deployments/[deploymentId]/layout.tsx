import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getDeployment } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/page-header";
import { CopyButton } from "@/components/ui/copy-button";
import { DeploymentNav } from "@/components/deployments/deployment-nav";

export default async function DeploymentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ deploymentId: string }>;
}) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Deployments", href: "/dashboard/deployments" },
            { label: deployment.name },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-fg">
                {deployment.name}
              </h1>
              <StatusBadge status={deployment.status} />
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-muted">
              <Link
                href={`/dashboard/projects/${deployment.projectId}`}
                className="transition-colors hover:text-fg"
              >
                {deployment.projectName}
              </Link>
              <span className="text-fg-subtle">/</span>
              <span className="font-mono text-[12px]">
                {deployment.modelName}:v{deployment.modelVersion}
              </span>
              <span className="text-fg-subtle">·</span>
              <span>{deployment.region}</span>
            </p>
          </div>

          {deployment.endpointUrl && (
            <div className="flex items-center gap-2">
              <code className="hidden rounded-control border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-fg-muted sm:block">
                {deployment.endpointUrl}
              </code>
              <CopyButton value={deployment.endpointUrl} label="Copy" />
              <a
                href={deployment.endpointUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open endpoint in a new tab"
                className="flex size-8 items-center justify-center rounded-control border border-line-strong bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      <DeploymentNav deploymentId={deploymentId} />
      {children}
    </div>
  );
}
