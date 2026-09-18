// Types mirroring the FastAPI pydantic schemas.
// Field names are camelCase to match the JSON the control plane serialises.

export type ISODateString = string;

/* ---------------------------------------------------------------- identity */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: ISODateString;
}

export type OAuthProvider = "google" | "github";

export interface Account {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
}

/* ---------------------------------------------------------------- projects */

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** Denormalised counts the list endpoint returns alongside the row. */
  modelCount: number;
  deploymentCount: number;
}

/* ------------------------------------------------------------------ models */

/** The logical container. Each uploaded artifact is a ModelVersion. */
export interface Model {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  versionCount: number;
  latestVersion: ModelVersion | null;
}

export type ModelVersionStatus =
  | "uploading"
  | "inspecting"
  | "ready"
  | "failed";

/** An ONNX tensor as read off the graph. */
export interface TensorSpec {
  name: string;
  /** null entries are dynamic axes, e.g. [null, 3, 224, 224] for a batch dim. */
  shape: (number | null)[];
  dtype: string;
}

export interface ModelVersion {
  id: string;
  modelId: string;
  version: number;
  status: ModelVersionStatus;
  /** Read from the ONNX producer_name field. */
  framework: string | null;
  producerName: string | null;
  opsetVersion: number | null;
  fileSize: number;
  fileName: string;
  checksum: string | null;
  storagePath: string;
  inputSchema: TensorSpec[];
  outputSchema: TensorSpec[];
  errorMessage: string | null;
  createdAt: ISODateString;
}

/* ------------------------------------------------------------- deployments */

export type DeploymentStatus =
  | "pending"
  | "provisioning"
  | "live"
  | "updating"
  | "degraded"
  | "failed"
  | "stopped";

export interface Deployment {
  id: string;
  projectId: string;
  modelVersionId: string;
  name: string;
  slug: string;
  status: DeploymentStatus;
  /** https://<domain>/d/<slug> once the ALB rule exists. */
  endpointUrl: string | null;
  region: string;
  /** AWS handles, used to reconcile the row against live infrastructure. */
  tfStateKey: string | null;
  ecsServiceName: string | null;
  targetGroupArn: string | null;
  albRuleArn: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastDeployedAt: ISODateString | null;
  config: DeploymentConfig;
  /** Joined for display — the list endpoint embeds these. */
  modelName: string;
  modelVersion: number;
  projectName: string;
}

export interface DeploymentConfig {
  id: string;
  deploymentId: string;
  /** Fargate task CPU units: 256 | 512 | 1024 | 2048 | 4096. */
  cpu: number;
  /** Task memory in MiB. */
  memory: number;
  /** ECS desired count. Replaces the old `replicas` on Deployment. */
  desiredCount: number;
  minCapacity: number;
  maxCapacity: number;
  /** Schema-only until GPU lands on EC2-backed ECS in phase 5. */
  gpu: boolean;
  containerImage: string;
  healthCheckPath: string;
  requestTimeoutSeconds: number;
  environment: Record<string, string>;
}

/** One line in the Terraform apply stream driving the deploy progress UI. */
export interface DeploymentEvent {
  id: string;
  deploymentId: string;
  phase: "queued" | "planning" | "applying" | "stabilising" | "complete" | "failed";
  message: string;
  createdAt: ISODateString;
}

/* ----------------------------------------------------------------- api keys */

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  /** Shown in the UI; the full key is returned once at creation. */
  keyPrefix: string;
  lastUsedAt: ISODateString | null;
  revokedAt: ISODateString | null;
  createdAt: ISODateString;
}

/* --------------------------------------------------------------- telemetry */

export interface ApiRequest {
  id: string;
  deploymentId: string;
  statusCode: number;
  latencyMs: number;
  createdAt: ISODateString;
}

export interface MetricPoint {
  t: ISODateString;
  value: number;
}

export interface DeploymentMetrics {
  requestsTotal: number;
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  requests: MetricPoint[];
  latency: MetricPoint[];
}

export type LogLevel = "info" | "warn" | "error";

export interface LogLine {
  id: string;
  timestamp: ISODateString;
  level: LogLevel;
  message: string;
}
