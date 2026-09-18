import type { Metadata } from "next";
import { Github } from "lucide-react";
import { mockUser } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/ui/page-header";
import { DetailRow } from "@/components/ui/stat";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Your account and the OAuth providers bound to it."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Name and email come from the provider you signed in with.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name" htmlFor="name">
            <Input id="name" defaultValue={mockUser.name} />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            hint="Managed by your identity provider."
          >
            <Input id="email" defaultValue={mockUser.email} disabled />
          </Field>
        </CardContent>
        <CardFooter>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Connected accounts</CardTitle>
            <CardDescription>
              One user can bind both Google and GitHub.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-control border border-line bg-surface-2 px-3 py-2.5">
            <span className="flex items-center gap-2.5 text-[13px] text-fg">
              <Github className="size-4 text-fg-muted" />
              GitHub
            </span>
            <Badge tone="live">Connected</Badge>
          </div>
          <div className="flex items-center justify-between rounded-control border border-line bg-surface-2 px-3 py-2.5">
            <span className="flex items-center gap-2.5 text-[13px] text-fg">
              <span
                aria-hidden
                className="flex size-4 items-center justify-center font-semibold text-fg-muted"
              >
                G
              </span>
              Google
            </span>
            <Button variant="outline" size="sm">
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="User ID" mono>
              {mockUser.id}
            </DetailRow>
            <DetailRow label="Member since">
              {formatDate(mockUser.createdAt)}
            </DetailRow>
            <DetailRow label="Default region">us-east-1</DetailRow>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
