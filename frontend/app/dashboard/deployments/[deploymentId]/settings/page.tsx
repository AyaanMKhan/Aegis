import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { getDeployment } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Settings" };

export default async function DeploymentSettingsPage({
  params,
}: {
  params: Promise<{ deploymentId: string }>;
}) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);
  if (!deployment) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Deployment name</CardTitle>
            <CardDescription>
              The display name. The slug in the endpoint URL is fixed once the
              ALB rule exists.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name" htmlFor="dep-name">
            <Input id="dep-name" defaultValue={deployment.name} />
          </Field>
          <Field
            label="Slug"
            htmlFor="dep-slug"
            hint="Immutable — changing it would orphan the listener rule."
          >
            <Input
              id="dep-slug"
              defaultValue={deployment.slug}
              disabled
              className="font-mono text-[12px]"
            />
          </Field>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm">
            Save
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-failed/25">
        <CardHeader className="border-failed/20">
          <div>
            <CardTitle className="flex items-center gap-2 text-failed">
              <AlertTriangle className="size-4" />
              Danger zone
            </CardTitle>
            <CardDescription>
              Deleting runs a real <span className="font-mono">terraform destroy</span>{" "}
              against state key{" "}
              <span className="font-mono text-[12px]">{deployment.tfStateKey}</span>.
              The ECS service, target group, and listener rule are removed. The
              model artifact in S3 is kept.
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="border-failed/20">
          <Button variant="danger" size="sm">
            <Trash2 />
            Delete deployment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
