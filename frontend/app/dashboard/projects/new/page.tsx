import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { NewProjectForm } from "@/components/projects/new-project-form";

export const metadata: Metadata = {
  title: "New project",
  description:
    "Create an Aegis project to group models and the Fargate services deployed from them.",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/dashboard/projects" },
          { label: "New project" },
        ]}
        title="Create project"
        description="A project is the container for your models and the deployments made from them. You can rename it later; the slug is harder to change once deployments exist."
      />

      <NewProjectForm />

      <div className="flex gap-3 rounded-card border border-line bg-surface-2/40 px-4 py-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-fg-muted">
          Creating a project writes a row to Postgres — nothing is provisioned in
          AWS. The VPC, shared ALB, ECS cluster and ECR registry already exist as
          the hand-applied baseline. Real infrastructure appears only when you
          create a deployment, which runs{" "}
          <code className="font-mono text-[12px] text-fg">terraform apply</code>{" "}
          against the deployment module under its own state key and adds a task
          definition, Fargate service, target group and ALB listener rule.
        </p>
      </div>
    </div>
  );
}
