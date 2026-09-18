import type { Metadata } from "next";
import { KeyRound, Plus } from "lucide-react";
import { mockApiKeys, MOCK_NOW } from "@/lib/mock-data";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata: Metadata = { title: "API keys" };

export default function ApiKeysPage() {
  const active = mockApiKeys.filter((k) => !k.revokedAt);
  const revoked = mockApiKeys.filter((k) => k.revokedAt);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API keys"
        description="Keys authenticate requests to every deployment endpoint. Only the prefix is stored in plaintext — the full key is hashed at rest and shown exactly once, at creation."
        actions={
          <Button size="sm">
            <Plus />
            Create key
          </Button>
        }
      />

      <Card>
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Key</TH>
              <TH>Last used</TH>
              <TH>Created</TH>
              <TH className="text-right">Status</TH>
            </tr>
          </THead>
          <tbody>
            {[...active, ...revoked].map((key) => (
              <TR key={key.id}>
                <TD className="font-medium text-fg">{key.name}</TD>
                <TD>
                  <span className="inline-flex items-center gap-2">
                    <code className="font-mono text-[12px] text-fg-muted">
                      {key.keyPrefix}
                      <span className="text-fg-subtle">{"…"}</span>
                    </code>
                    {!key.revokedAt && <CopyButton value={key.keyPrefix} />}
                  </span>
                </TD>
                <TD className="tnum">
                  {key.lastUsedAt
                    ? formatRelativeTime(key.lastUsedAt, MOCK_NOW)
                    : "Never"}
                </TD>
                <TD className="tnum">{formatDate(key.createdAt)}</TD>
                <TD className="text-right">
                  {key.revokedAt ? (
                    <Badge tone="failed">Revoked</Badge>
                  ) : (
                    <Badge tone="live">
                      <span className="size-1.5 rounded-full bg-live" />
                      Active
                    </Badge>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="flex gap-3 rounded-card border border-line bg-surface px-4 py-3.5">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
        <p className="text-[13px] leading-relaxed text-fg-muted">
          Send a key as{" "}
          <code className="font-mono text-[12px] text-fg">
            Authorization: Bearer &lt;key&gt;
          </code>
          . Revoking takes effect on the next request — the gateway checks the
          hash on every call, so there is no cache to wait out.
        </p>
      </div>
    </div>
  );
}
