import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { PhaseNotice } from "@/components/layout/phase-notice";

export const metadata: Metadata = { title: "Logs" };

export default function DeploymentLogsPage() {
  return (
    <PhaseNotice
      icon={ScrollText}
      phase="Phase 4 — Observability and keys"
      title="Log tailing is not wired up yet"
      description="Runner tasks already write to CloudWatch Logs. This tab will tail that log group once the control plane exposes it."
      bullets={[
        "Tails the deployment's CloudWatch log group over a streaming response",
        "Level filter, text search, and a jump-to-timestamp control",
        "Correlates a line's req_id with its ApiRequest row",
      ]}
    />
  );
}
