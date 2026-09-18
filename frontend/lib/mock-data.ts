/**
 * Fixture data standing in for the FastAPI control plane until phase 0 lands.
 *
 * Everything here is deterministic — no Math.random, no `new Date()` at module
 * scope beyond MOCK_NOW — so the server and client render identical markup.
 * Pass MOCK_NOW to `formatRelativeTime` so relative labels never drift either.
 */

import type {
  ApiKey,
  Deployment,
  DeploymentEvent,
  DeploymentMetrics,
  LogLine,
  MetricPoint,
  Model,
  ModelVersion,
  Project,
  User,
} from "@/types/api";

/** The frozen clock every fixture timestamp is measured from. */
export const MOCK_NOW = new Date("2026-09-17T14:20:00.000Z");

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO string for `ms` milliseconds before MOCK_NOW. */
function ago(ms: number): string {
  return new Date(MOCK_NOW.getTime() - ms).toISOString();
}

/** Deterministic 0..1 pseudo-random, so charts look organic but never shift. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export const BASE_DOMAIN = "aegis.sh";

/* ------------------------------------------------------------------- user */

export const mockUser: User = {
  id: "usr_01HQ8Z",
  email: "ayaan@aegis.sh",
  name: "Ayaan Khan",
  avatarUrl: null,
  createdAt: ago(210 * DAY),
};

/* --------------------------------------------------------------- projects */

export const mockProjects: Project[] = [
  {
    id: "prj_vision",
    userId: mockUser.id,
    name: "Vision Pipeline",
    slug: "vision-pipeline",
    description:
      "Image classification and detection models serving the product catalogue.",
    createdAt: ago(96 * DAY),
    updatedAt: ago(2 * HOUR),
    modelCount: 3,
    deploymentCount: 2,
  },
  {
    id: "prj_fraud",
    userId: mockUser.id,
    name: "Fraud Scoring",
    slug: "fraud-scoring",
    description: "Gradient-boosted risk scores exported to ONNX from XGBoost.",
    createdAt: ago(61 * DAY),
    updatedAt: ago(19 * HOUR),
    modelCount: 2,
    deploymentCount: 1,
  },
  {
    id: "prj_speech",
    userId: mockUser.id,
    name: "Speech Tagging",
    slug: "speech-tagging",
    description: "Keyword spotting on 16 kHz mono audio frames.",
    createdAt: ago(34 * DAY),
    updatedAt: ago(4 * DAY),
    modelCount: 1,
    deploymentCount: 1,
  },
  {
    id: "prj_sandbox",
    userId: mockUser.id,
    name: "Sandbox",
    slug: "sandbox",
    description: null,
    createdAt: ago(11 * DAY),
    updatedAt: ago(11 * DAY),
    modelCount: 0,
    deploymentCount: 0,
  },
];

/* ----------------------------------------------------------------- models */

export const mockModelVersions: ModelVersion[] = [
  {
    id: "mv_resnet_3",
    modelId: "mdl_resnet",
    version: 3,
    status: "ready",
    framework: "PyTorch",
    producerName: "pytorch",
    opsetVersion: 17,
    fileSize: 102_063_616,
    fileName: "resnet50-v3.onnx",
    checksum: "sha256:9f2c41ab7e05d3c8a1b6e0f4d72c9853ab41e7f0c2d6b98a4e1f70c3d582ab19",
    storagePath: "s3://aegis-models/prj_vision/mdl_resnet/v3.onnx",
    inputSchema: [{ name: "input", shape: [null, 3, 224, 224], dtype: "float32" }],
    outputSchema: [{ name: "logits", shape: [null, 1000], dtype: "float32" }],
    errorMessage: null,
    createdAt: ago(2 * HOUR),
  },
  {
    id: "mv_resnet_2",
    modelId: "mdl_resnet",
    version: 2,
    status: "ready",
    framework: "PyTorch",
    producerName: "pytorch",
    opsetVersion: 16,
    fileSize: 102_050_112,
    fileName: "resnet50-v2.onnx",
    checksum: "sha256:41ce90b2d7f6a8351c0e2b94d7ff6a1029c83b5e740d1a26f9b0c845e37d1caa",
    storagePath: "s3://aegis-models/prj_vision/mdl_resnet/v2.onnx",
    inputSchema: [{ name: "input", shape: [null, 3, 224, 224], dtype: "float32" }],
    outputSchema: [{ name: "logits", shape: [null, 1000], dtype: "float32" }],
    errorMessage: null,
    createdAt: ago(23 * DAY),
  },
  {
    id: "mv_resnet_1",
    modelId: "mdl_resnet",
    version: 1,
    status: "ready",
    framework: "PyTorch",
    producerName: "pytorch",
    opsetVersion: 16,
    fileSize: 101_998_592,
    fileName: "resnet50.onnx",
    checksum: "sha256:0b7ad1e5c9384f26ba70d5c1e8f34920ad76b3c5e1207fa94d3b6e08c25f1d73",
    storagePath: "s3://aegis-models/prj_vision/mdl_resnet/v1.onnx",
    inputSchema: [{ name: "input", shape: [null, 3, 224, 224], dtype: "float32" }],
    outputSchema: [{ name: "logits", shape: [null, 1000], dtype: "float32" }],
    errorMessage: null,
    createdAt: ago(88 * DAY),
  },
  {
    id: "mv_yolo_1",
    modelId: "mdl_yolo",
    version: 1,
    status: "ready",
    framework: "Ultralytics",
    producerName: "ultralytics",
    opsetVersion: 17,
    fileSize: 12_582_912,
    fileName: "yolov8n.onnx",
    checksum: "sha256:c41e8a09f7b2d6530a1e94c7b8d20f6a35e17c9b4d80a2f6531e7c09bd4a8e12",
    storagePath: "s3://aegis-models/prj_vision/mdl_yolo/v1.onnx",
    inputSchema: [{ name: "images", shape: [null, 3, 640, 640], dtype: "float32" }],
    outputSchema: [{ name: "output0", shape: [null, 84, 8400], dtype: "float32" }],
    errorMessage: null,
    createdAt: ago(9 * DAY),
  },
  {
    id: "mv_segment_1",
    modelId: "mdl_segment",
    version: 1,
    status: "inspecting",
    framework: null,
    producerName: null,
    opsetVersion: null,
    fileSize: 47_185_920,
    fileName: "segformer-b0.onnx",
    checksum: null,
    storagePath: "s3://aegis-models/prj_vision/mdl_segment/v1.onnx",
    inputSchema: [],
    outputSchema: [],
    errorMessage: null,
    createdAt: ago(3 * MINUTE),
  },
  {
    id: "mv_risk_4",
    modelId: "mdl_risk",
    version: 4,
    status: "ready",
    framework: "XGBoost",
    producerName: "onnxmltools",
    opsetVersion: 15,
    fileSize: 3_407_872,
    fileName: "risk-scorer-v4.onnx",
    checksum: "sha256:7e10ab4c2f9d8635b0c4e71a9f28d350bc6e41a97d20f5c8e3b1a640d97c2e5b",
    storagePath: "s3://aegis-models/prj_fraud/mdl_risk/v4.onnx",
    inputSchema: [{ name: "features", shape: [null, 42], dtype: "float32" }],
    outputSchema: [
      { name: "label", shape: [null], dtype: "int64" },
      { name: "probabilities", shape: [null, 2], dtype: "float32" },
    ],
    errorMessage: null,
    createdAt: ago(19 * HOUR),
  },
  {
    id: "mv_velocity_1",
    modelId: "mdl_velocity",
    version: 1,
    status: "failed",
    framework: null,
    producerName: null,
    opsetVersion: null,
    fileSize: 1_048_576,
    fileName: "velocity-check.onnx",
    checksum: null,
    storagePath: "s3://aegis-models/prj_fraud/mdl_velocity/v1.onnx",
    inputSchema: [],
    outputSchema: [],
    errorMessage:
      "Graph validation failed: opset 21 is newer than the runtime's supported maximum of 18.",
    createdAt: ago(6 * DAY),
  },
  {
    id: "mv_kws_2",
    modelId: "mdl_kws",
    version: 2,
    status: "ready",
    framework: "TensorFlow",
    producerName: "tf2onnx",
    opsetVersion: 15,
    fileSize: 8_912_896,
    fileName: "keyword-spotter-v2.onnx",
    checksum: "sha256:b5d0193c7ae4f2860d1b93e5c7420af8613de29b0c74a5f1e8d63b092a4c7f60",
    storagePath: "s3://aegis-models/prj_speech/mdl_kws/v2.onnx",
    inputSchema: [{ name: "audio", shape: [null, 16000], dtype: "float32" }],
    outputSchema: [{ name: "scores", shape: [null, 12], dtype: "float32" }],
    errorMessage: null,
    createdAt: ago(4 * DAY),
  },
];

function versionsOf(modelId: string): ModelVersion[] {
  return mockModelVersions.filter((v) => v.modelId === modelId);
}

function buildModel(
  id: string,
  projectId: string,
  name: string,
  description: string | null,
  createdAt: string,
): Model {
  const versions = versionsOf(id);
  return {
    id,
    projectId,
    name,
    description,
    createdAt,
    updatedAt: versions[0]?.createdAt ?? createdAt,
    versionCount: versions.length,
    latestVersion: versions[0] ?? null,
  };
}

export const mockModels: Model[] = [
  buildModel(
    "mdl_resnet",
    "prj_vision",
    "resnet50-classifier",
    "ImageNet-pretrained ResNet-50 fine-tuned on the product catalogue.",
    ago(88 * DAY),
  ),
  buildModel(
    "mdl_yolo",
    "prj_vision",
    "yolov8n-detector",
    "Nano object detector for shelf images.",
    ago(9 * DAY),
  ),
  buildModel(
    "mdl_segment",
    "prj_vision",
    "segformer-b0",
    "Semantic segmentation, currently being inspected.",
    ago(3 * MINUTE),
  ),
  buildModel(
    "mdl_risk",
    "prj_fraud",
    "risk-scorer",
    "Gradient-boosted transaction risk score.",
    ago(58 * DAY),
  ),
  buildModel(
    "mdl_velocity",
    "prj_fraud",
    "velocity-check",
    "Rolling-window velocity features. Upload failed validation.",
    ago(6 * DAY),
  ),
  buildModel(
    "mdl_kws",
    "prj_speech",
    "keyword-spotter",
    "12-class keyword spotting on 1s audio windows.",
    ago(30 * DAY),
  ),
];

/* ------------------------------------------------------------ deployments */

function config(
  deploymentId: string,
  overrides: Partial<Deployment["config"]> = {},
): Deployment["config"] {
  return {
    id: `cfg_${deploymentId}`,
    deploymentId,
    cpu: 1024,
    memory: 2048,
    desiredCount: 2,
    minCapacity: 1,
    maxCapacity: 4,
    gpu: false,
    containerImage:
      "376129853500.dkr.ecr.us-east-1.amazonaws.com/aegis-runner:0.4.2",
    healthCheckPath: "/healthz",
    requestTimeoutSeconds: 30,
    environment: {},
    ...overrides,
  };
}

export const mockDeployments: Deployment[] = [
  {
    id: "dep_resnet_prod",
    projectId: "prj_vision",
    modelVersionId: "mv_resnet_3",
    name: "resnet50-prod",
    slug: "resnet50-prod",
    status: "live",
    endpointUrl: `https://${BASE_DOMAIN}/d/resnet50-prod`,
    region: "us-east-1",
    tfStateKey: "deployments/dep_resnet_prod/terraform.tfstate",
    ecsServiceName: "aegis-dep-resnet50-prod",
    targetGroupArn:
      "arn:aws:elasticloadbalancing:us-east-1:376129853500:targetgroup/aegis-resnet50-prod/8f21c0a4e7b35d19",
    albRuleArn:
      "arn:aws:elasticloadbalancing:us-east-1:376129853500:listener-rule/app/aegis-shared/1a2b3c4d5e6f/9c8b7a6d5e4f/2b3c4d5e6f7a8b9c",
    createdAt: ago(84 * DAY),
    updatedAt: ago(2 * HOUR),
    lastDeployedAt: ago(2 * HOUR),
    config: config("dep_resnet_prod", { desiredCount: 3, maxCapacity: 8 }),
    modelName: "resnet50-classifier",
    modelVersion: 3,
    projectName: "Vision Pipeline",
  },
  {
    id: "dep_yolo_staging",
    projectId: "prj_vision",
    modelVersionId: "mv_yolo_1",
    name: "yolov8n-staging",
    slug: "yolov8n-staging",
    status: "provisioning",
    endpointUrl: null,
    region: "us-east-1",
    tfStateKey: "deployments/dep_yolo_staging/terraform.tfstate",
    ecsServiceName: "aegis-dep-yolov8n-staging",
    targetGroupArn: null,
    albRuleArn: null,
    createdAt: ago(4 * MINUTE),
    updatedAt: ago(40_000),
    lastDeployedAt: null,
    config: config("dep_yolo_staging", {
      cpu: 2048,
      memory: 4096,
      desiredCount: 1,
      maxCapacity: 2,
    }),
    modelName: "yolov8n-detector",
    modelVersion: 1,
    projectName: "Vision Pipeline",
  },
  {
    id: "dep_risk_prod",
    projectId: "prj_fraud",
    modelVersionId: "mv_risk_4",
    name: "risk-scorer-prod",
    slug: "risk-scorer-prod",
    status: "live",
    endpointUrl: `https://${BASE_DOMAIN}/d/risk-scorer-prod`,
    region: "us-east-1",
    tfStateKey: "deployments/dep_risk_prod/terraform.tfstate",
    ecsServiceName: "aegis-dep-risk-scorer-prod",
    targetGroupArn:
      "arn:aws:elasticloadbalancing:us-east-1:376129853500:targetgroup/aegis-risk-prod/4d71e0b9c3a62f80",
    albRuleArn:
      "arn:aws:elasticloadbalancing:us-east-1:376129853500:listener-rule/app/aegis-shared/1a2b3c4d5e6f/9c8b7a6d5e4f/7f6e5d4c3b2a1908",
    createdAt: ago(57 * DAY),
    updatedAt: ago(19 * HOUR),
    lastDeployedAt: ago(19 * HOUR),
    config: config("dep_risk_prod", {
      cpu: 512,
      memory: 1024,
      desiredCount: 2,
      environment: { SCORE_THRESHOLD: "0.82", LOG_LEVEL: "info" },
    }),
    modelName: "risk-scorer",
    modelVersion: 4,
    projectName: "Fraud Scoring",
  },
  {
    id: "dep_kws_prod",
    projectId: "prj_speech",
    modelVersionId: "mv_kws_2",
    name: "keyword-spotter",
    slug: "keyword-spotter",
    status: "degraded",
    endpointUrl: `https://${BASE_DOMAIN}/d/keyword-spotter`,
    region: "us-east-1",
    tfStateKey: "deployments/dep_kws_prod/terraform.tfstate",
    ecsServiceName: "aegis-dep-keyword-spotter",
    targetGroupArn:
      "arn:aws:elasticloadbalancing:us-east-1:376129853500:targetgroup/aegis-kws/2c90d4a16b78e350",
    albRuleArn:
      "arn:aws:elasticloadbalancing:us-east-1:376129853500:listener-rule/app/aegis-shared/1a2b3c4d5e6f/9c8b7a6d5e4f/5a4b3c2d1e0f9a8b",
    createdAt: ago(28 * DAY),
    updatedAt: ago(42 * MINUTE),
    lastDeployedAt: ago(4 * DAY),
    config: config("dep_kws_prod", { cpu: 512, memory: 1024, desiredCount: 1 }),
    modelName: "keyword-spotter",
    modelVersion: 2,
    projectName: "Speech Tagging",
  },
];

export const mockDeploymentEvents: DeploymentEvent[] = [
  {
    id: "evt_1",
    deploymentId: "dep_yolo_staging",
    phase: "queued",
    message: "Deployment queued behind 0 other applies.",
    createdAt: ago(4 * MINUTE),
  },
  {
    id: "evt_2",
    deploymentId: "dep_yolo_staging",
    phase: "planning",
    message: "terraform init — backend s3 configured, 4 providers loaded.",
    createdAt: ago(3 * MINUTE - 20_000),
  },
  {
    id: "evt_3",
    deploymentId: "dep_yolo_staging",
    phase: "planning",
    message: "Plan: 6 to add, 0 to change, 0 to destroy.",
    createdAt: ago(2 * MINUTE - 10_000),
  },
  {
    id: "evt_4",
    deploymentId: "dep_yolo_staging",
    phase: "applying",
    message: "aws_ecs_task_definition.runner: Creation complete after 2s.",
    createdAt: ago(80_000),
  },
  {
    id: "evt_5",
    deploymentId: "dep_yolo_staging",
    phase: "applying",
    message: "aws_lb_target_group.this: Creating…",
    createdAt: ago(40_000),
  },
];

/* --------------------------------------------------------------- api keys */

export const mockApiKeys: ApiKey[] = [
  {
    id: "key_prod",
    userId: mockUser.id,
    name: "Production server",
    keyPrefix: "aeg_live_7Kq2",
    lastUsedAt: ago(3 * MINUTE),
    revokedAt: null,
    createdAt: ago(84 * DAY),
  },
  {
    id: "key_ci",
    userId: mockUser.id,
    name: "CI pipeline",
    keyPrefix: "aeg_live_M04x",
    lastUsedAt: ago(9 * HOUR),
    revokedAt: null,
    createdAt: ago(40 * DAY),
  },
  {
    id: "key_old",
    userId: mockUser.id,
    name: "Laptop (rotated)",
    keyPrefix: "aeg_live_ZZ81",
    lastUsedAt: ago(52 * DAY),
    revokedAt: ago(50 * DAY),
    createdAt: ago(90 * DAY),
  },
];

/* -------------------------------------------------------------- telemetry */

/** 48 hourly points with a diurnal shape, deterministic per deployment. */
function series(seed: number, base: number, spread: number): MetricPoint[] {
  const rand = seeded(seed);
  return Array.from({ length: 48 }, (_, i) => {
    const hoursBack = 47 - i;
    const hourOfDay = (MOCK_NOW.getUTCHours() - hoursBack + 48) % 24;
    // Daytime traffic peak, smoothed.
    const diurnal = 0.55 + 0.45 * Math.sin(((hourOfDay - 4) / 24) * Math.PI * 2);
    const noise = 0.85 + rand() * 0.3;
    return {
      t: ago(hoursBack * HOUR),
      value: Math.round((base * diurnal + spread * (rand() - 0.5)) * noise),
    };
  });
}

export const mockMetrics: Record<string, DeploymentMetrics> = {
  dep_resnet_prod: {
    requestsTotal: 1_284_301,
    errorRate: 0.0021,
    p50LatencyMs: 34,
    p95LatencyMs: 71,
    requests: series(101, 2600, 340),
    latency: series(202, 36, 14),
  },
  dep_risk_prod: {
    requestsTotal: 486_920,
    errorRate: 0.0004,
    p50LatencyMs: 8,
    p95LatencyMs: 19,
    requests: series(303, 980, 160),
    latency: series(404, 9, 5),
  },
  dep_kws_prod: {
    requestsTotal: 72_418,
    errorRate: 0.0413,
    p50LatencyMs: 52,
    p95LatencyMs: 310,
    requests: series(505, 150, 70),
    latency: series(606, 60, 40),
  },
  dep_yolo_staging: {
    requestsTotal: 0,
    errorRate: 0,
    p50LatencyMs: 0,
    p95LatencyMs: 0,
    requests: series(707, 0, 0),
    latency: series(808, 0, 0),
  },
};

export const mockLogs: LogLine[] = [
  {
    id: "log_1",
    timestamp: ago(12_000),
    level: "info",
    message: 'POST /d/resnet50-prod/predict 200 in 31ms req_id=8c1d0a "python-requests/2.32"',
  },
  {
    id: "log_2",
    timestamp: ago(26_000),
    level: "info",
    message: 'POST /d/resnet50-prod/predict 200 in 28ms req_id=4b70f2 "aegis-sdk/0.2.1"',
  },
  {
    id: "log_3",
    timestamp: ago(48_000),
    level: "warn",
    message: "Input batch size 64 exceeds tuned batch 32 — falling back to chunked inference.",
  },
  {
    id: "log_4",
    timestamp: ago(71_000),
    level: "info",
    message: "onnxruntime: session warm, 4 intra-op threads, provider=CPUExecutionProvider",
  },
  {
    id: "log_5",
    timestamp: ago(96_000),
    level: "error",
    message: 'POST /d/resnet50-prod/predict 422 in 3ms req_id=1f9e3c "shape [1,3,256,256] does not match [batch,3,224,224]"',
  },
];

/* --------------------------------------------------------------- lookups */

export function getProject(projectId: string): Project | undefined {
  return mockProjects.find((p) => p.id === projectId);
}

export function getModelsForProject(projectId: string): Model[] {
  return mockModels.filter((m) => m.projectId === projectId);
}

export function getModel(modelId: string): Model | undefined {
  return mockModels.find((m) => m.id === modelId);
}

export function getVersionsForModel(modelId: string): ModelVersion[] {
  return versionsOf(modelId);
}

export function getDeployment(deploymentId: string): Deployment | undefined {
  return mockDeployments.find((d) => d.id === deploymentId);
}

export function getDeploymentsForProject(projectId: string): Deployment[] {
  return mockDeployments.filter((d) => d.projectId === projectId);
}

export function getMetrics(deploymentId: string): DeploymentMetrics {
  return mockMetrics[deploymentId] ?? mockMetrics.dep_yolo_staging;
}

export function getEventsForDeployment(deploymentId: string): DeploymentEvent[] {
  return mockDeploymentEvents.filter((e) => e.deploymentId === deploymentId);
}

/** Aggregate figures for the dashboard hero row. */
export const mockDashboardSummary = {
  liveDeployments: mockDeployments.filter((d) => d.status === "live").length,
  totalDeployments: mockDeployments.length,
  requests24h: 68_412,
  requests24hDelta: 0.126,
  p95LatencyMs: 71,
  p95LatencyDelta: -0.048,
  errorRate: 0.0031,
  errorRateDelta: 0.0009,
  monthlySpendUsd: 38.42,
};
