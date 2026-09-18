import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ModelUploadFlow } from "@/components/models/model-upload-flow";
import { getProject } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) return { title: "Project not found" };
  return {
    title: `Upload a model · ${project.name}`,
    description: `Upload an ONNX model to ${project.name}. Aegis parses the graph and turns its tensor signature into a deployable API.`,
  };
}

export default async function UploadModelPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/dashboard/projects" },
          { label: project.name, href: `/dashboard/projects/${project.id}` },
          { label: "Upload model" },
        ]}
        title="Upload a model"
        description="The file goes straight to S3 with a presigned URL. Aegis then loads the ONNX graph, records the opset and checksum, and stores the input and output tensors as the version's signature."
      />

      <ModelUploadFlow projectId={project.id} projectName={project.name} />
    </div>
  );
}
