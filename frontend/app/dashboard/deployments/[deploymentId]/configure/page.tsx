import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/deployments/config-form";
import { formatCpu, formatMemory } from "@/lib/format";
import { getDeployment } from "@/lib/mock-data";

type Props = { params: Promise<{ deploymentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) return { title: "Deployment not found" };

  return {
    title: `Configure ${deployment.name}`,
    description: `Task size, scaling, health checks and environment for the ${deployment.name} Fargate service.`,
  };
}

export default async function DeploymentConfigurePage({ params }: Props) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) notFound();

  const { config } = deployment;

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-[13px] leading-relaxed text-fg-muted">
        Every field here becomes a Terraform variable for{" "}
        <span className="font-mono text-[12px]">infra/modules/deployment</span>.
        This deployment is configured for{" "}
        <span className="tnum text-fg">
          {config.desiredCount} {config.desiredCount === 1 ? "task" : "tasks"}
        </span>{" "}
        at{" "}
        <span className="tnum text-fg">
          {formatCpu(config.cpu)} · {formatMemory(config.memory)}
        </span>
        . Changes are staged in the browser until you save.
      </p>

      <ConfigForm deployment={deployment} />
    </div>
  );
}
