import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getDeploymentsForProject, mockProjects } from "@/lib/mock-data";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectGrid } from "@/components/projects/project-grid";
import type { ProjectCardData } from "@/components/projects/project-card";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every Aegis project, with its models, deployments and current service health.",
};

export default function ProjectsPage() {
  const items: ProjectCardData[] = mockProjects.map((project) => ({
    project,
    deploymentStatuses: getDeploymentsForProject(project.id).map(
      (d) => d.status,
    ),
  }));

  const models = mockProjects.reduce((n, p) => n + p.modelCount, 0);
  const deployments = mockProjects.reduce((n, p) => n + p.deploymentCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${mockProjects.length} projects · ${models} models · ${deployments} deployments. A project groups models and the Fargate services deployed from them.`}
        actions={
          <ButtonLink href="/dashboard/projects/new" size="sm">
            <Plus />
            New project
          </ButtonLink>
        }
      />
      <ProjectGrid items={items} />
    </div>
  );
}
