import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { PhaseNotice } from "@/components/layout/phase-notice";

export const metadata: Metadata = { title: "Monitoring" };

export default function DeploymentMonitoringPage() {
  return (
    <PhaseNotice
      icon={Activity}
      phase="Phase 4 — Observability and keys"
      title="Full monitoring lands with request recording"
      description="The Overview tab already charts request volume. This tab expands it once ApiRequest rows are being written by the gateway."
      bullets={[
        "Request rate, error rate, and latency percentiles over a selectable range",
        "Per-status-code breakdown, and slowest requests",
        "ECS task count and CPU/memory against the configured task size",
      ]}
    />
  );
}
