import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  KeyRound,
  ScanLine,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  MOCK_NOW,
  getDeployment,
  getEventsForDeployment,
  getMetrics,
  getModel,
  mockApiKeys,
} from "@/lib/mock-data";
import { formatLatency, formatPercent, formatRelativeTime } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "live" | "pending" | "failed" | "info" | "neutral";

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  detail: string;
  /** Terraform output and graph errors read as machine text. */
  mono?: boolean;
  at: string;
  href: string;
}

const toneClass: Record<Tone, string> = {
  live: "border-live/25 bg-live/10 text-live",
  pending: "border-pending/25 bg-pending/10 text-pending",
  failed: "border-failed/25 bg-failed/10 text-failed",
  info: "border-info/25 bg-info/10 text-info",
  neutral: "border-line-strong bg-surface-2 text-fg-subtle",
};

/** Every entry below is derived from a fixture row — nothing is invented. */
function buildActivity(): ActivityItem[] {
  const items: ActivityItem[] = [];

  const yolo = getDeployment("dep_yolo_staging");
  const lastEvent = getEventsForDeployment("dep_yolo_staging").at(-1);
  if (yolo && lastEvent) {
    items.push({
      id: `evt-${lastEvent.id}`,
      icon: ScanLine,
      tone: "pending",
      title: `${yolo.name} is provisioning`,
      detail: lastEvent.message,
      mono: true,
      at: lastEvent.createdAt,
      href: `/dashboard/deployments/${yolo.id}`,
    });
  }

  const segment = getModel("mdl_segment");
  const segmentVersion = segment?.latestVersion;
  if (segment && segmentVersion) {
    items.push({
      id: `mv-${segmentVersion.id}`,
      icon: ScanLine,
      tone: "pending",
      title: `${segment.name} v${segmentVersion.version} uploaded`,
      detail: "Reading the ONNX graph for tensor shapes, dtypes and opset.",
      at: segmentVersion.createdAt,
      href: `/dashboard/models/${segment.id}`,
    });
  }

  const prodKey = mockApiKeys.find((k) => k.id === "key_prod");
  if (prodKey?.lastUsedAt) {
    items.push({
      id: `key-${prodKey.id}`,
      icon: KeyRound,
      tone: "info",
      title: `${prodKey.name} key authenticated a request`,
      detail: `${prodKey.keyPrefix}…`,
      mono: true,
      at: prodKey.lastUsedAt,
      href: "/dashboard/api-keys",
    });
  }

  const kws = getDeployment("dep_kws_prod");
  if (kws) {
    const metrics = getMetrics(kws.id);
    items.push({
      id: `dep-${kws.id}`,
      icon: TriangleAlert,
      tone: "failed",
      title: `${kws.name} went degraded`,
      detail: `p95 ${formatLatency(metrics.p95LatencyMs)}, ${formatPercent(
        metrics.errorRate,
        1,
      )} of requests failing.`,
      at: kws.updatedAt,
      href: `/dashboard/deployments/${kws.id}`,
    });
  }

  const resnet = getDeployment("dep_resnet_prod");
  if (resnet?.lastDeployedAt) {
    items.push({
      id: `dep-${resnet.id}`,
      icon: CheckCircle2,
      tone: "live",
      title: `${resnet.name} went live`,
      detail: `${resnet.modelName} v${resnet.modelVersion} on ${resnet.config.desiredCount} Fargate tasks.`,
      at: resnet.lastDeployedAt,
      href: `/dashboard/deployments/${resnet.id}`,
    });
  }

  const velocity = getModel("mdl_velocity");
  const velocityVersion = velocity?.latestVersion;
  if (velocity && velocityVersion?.errorMessage) {
    items.push({
      id: `mv-${velocityVersion.id}`,
      icon: XCircle,
      tone: "failed",
      title: `${velocity.name} v${velocityVersion.version} failed validation`,
      detail: velocityVersion.errorMessage,
      mono: true,
      at: velocityVersion.createdAt,
      href: `/dashboard/models/${velocity.id}`,
    });
  }

  return items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export function ActivityFeed({ className }: { className?: string }) {
  const items = buildActivity();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0 py-0">
        <ol className="divide-y divide-line">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border",
                      toneClass[item.tone],
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13px] text-fg">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[11px] tnum text-fg-subtle">
                        {formatRelativeTime(item.at, MOCK_NOW)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[12px] leading-relaxed text-fg-muted",
                        item.mono && "font-mono text-[11.5px] break-words",
                      )}
                    >
                      {item.detail}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
