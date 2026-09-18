# Aegis — Build Plan

## Context

Aegis takes an ONNX model file and turns it into a deployed HTTPS API secured by an
API key. A user signs in with Google or GitHub, creates a project, uploads a model,
and gets back a live endpoint with docs, logs, and metrics.

The product is real, but the **primary goal is learning Terraform and AWS**. That
goal decides the architecture wherever the two conflict: we prefer the approach that
puts more AWS primitives under our own hands over the one that hides them behind a
managed service, and we prefer boring, inspectable infrastructure over clever
abstractions. Where a shortcut costs no learning (see the runner image below), we
take the shortcut.

## Decisions

| Area | Decision | Why |
|---|---|---|
| Runtime | **ECS Fargate, one service per deployment, behind a shared ALB** | Teaches the classic AWS surface — VPC, subnets, security groups, ALB, target groups, task definitions, IAM, autoscaling. Maps 1:1 onto the `DeploymentConfig` fields. |
| Terraform | **Baseline by hand; per-deployment module run by the API** | Baseline (`infra/baseline`) is `terraform apply`-ed manually. Each deployment is a real `terraform apply` of `infra/modules/deployment` with its own state key. Terraform is the engine of the product, not just setup. |
| Frontend | **Next.js 16, frontend only** | App Router gives the file-based routing, layouts, and route groups the structure calls for. Zero Next API routes — every call goes to FastAPI. |
| Backend | **FastAPI + SQLAlchemy 2 + Postgres** | Python is the right language for ONNX graph introspection, and it owns all business logic. |
| Build step | **One shared runner image now; per-model CodeBuild in phase 2** | A single container reads `MODEL_S3_URI` at startup. Deploys take ~45s instead of ~8min with no build infra to maintain. No AWS learning is lost — that lives in ECS/ALB/IAM. |
| TLS | **Registered domain + Route 53 + ACM** | AWS will not issue a certificate for the default `*.elb.amazonaws.com` name, so a real domain is the only path to the HTTPS endpoint in the design. |

### The one to revisit

The shared-runner choice is the deliberate deviation from the original diagram, which
showed a Docker image built per model. Phase 2 adds that as an explicit optimization
so the cold-start difference can be measured rather than assumed. Until then
`containerImage` holds the shared runner tag, which keeps the column meaningful.

## Architecture

```
Next.js dashboard ──► FastAPI control plane ──► Postgres
                            │
                            ├──► S3            (.onnx artifacts)
                            └──► terraform apply
                                      │
                                      ▼
                          ECS Fargate service ◄── ECR (shared runner image)
                                      │              └─ pulls .onnx from S3 at boot
                                      ▼
                            shared ALB ──► https://<domain>/d/<deployment-slug>
```

One ALB is shared by every deployment and routed by path, so the idle cost stays flat
at roughly $16/mo no matter how many models are deployed.

## Data model

Two changes to the original schema, both reflected in `backend/app/models/`:

- **`Model` splits into `Model` + `ModelVersion`.** `Model` is the logical container
  (name, description); `ModelVersion` holds each uploaded artifact and everything
  derived from it. This is what makes the "Model Versions" screen mean something, and
  it is where `version`, `framework`, `fileSize`, `storagePath` and `status` belong.
- **`replicas` lives only on `DeploymentConfig`.** It appeared on both `Deployment`
  and `DeploymentConfig`; two writable copies of one number will drift. Renamed
  `desiredCount` to match the ECS concept it maps to.

Plus `User` and `Account`, which the original schema implied but did not list —
everything hangs off `userId`, and `Account` holds the OAuth provider link so one
user can bind both Google and GitHub.

```
User ──< Account
  └──< Project ──< Model ──< ModelVersion ──< Deployment ──1 DeploymentConfig
  └──< ApiKey                                       └──< ApiRequest
```

Fields worth calling out beyond the original schema:

- `ModelVersion`: `inputSchema` / `outputSchema` (JSON, extracted from the graph),
  `opsetVersion`, `producerName`, `checksum`
- `Deployment`: `tfStateKey`, `ecsServiceName`, `targetGroupArn`, `albRuleArn` —
  the handles needed to reconcile a row against live AWS
- `ApiKey`: `keyPrefix` (shown in the UI) alongside `keyHash`, plus `revokedAt`

## Phases

### Phase 0 — Local foundation
Postgres via `docker-compose up`, FastAPI running, Next.js running, SQLAlchemy models
and the Alembic baseline migration, Google + GitHub OAuth through Authlib with a
signed session cookie. Ends with: sign in, create a project, see it persist.

### Phase 1 — Model upload and inspection
Presigned S3 upload straight from the browser. On completion the backend parses the
graph with `onnx`: reads `producer_name` to fill `framework`, extracts input/output
tensor names, shapes and dtypes into `inputSchema`/`outputSchema`, records opset and
checksum. Ends with: upload a `.onnx`, see its real signature in the UI.

### Phase 2 — Baseline infrastructure *(the Terraform-heavy phase)*
Written and applied by hand, reviewing every plan before it runs:
VPC with public and private subnets → security groups → shared ALB with an HTTPS
listener → ECS cluster → ECR → S3 buckets → RDS Postgres → Route 53 hosted zone and a
DNS-validated ACM certificate → IAM roles. Remote state in S3 with DynamoDB locking
from the very first apply. Ends with: a hand-deployed hello-world service reachable
over HTTPS at the real domain.

### Phase 3 — Programmatic deployment
The runner image is built and pushed to ECR. The API renders tfvars, runs
`terraform init/apply` against `infra/modules/deployment` with state key
`deployments/<id>/terraform.tfstate`, and streams progress to the deployment row.
Delete performs a real `terraform destroy`. Ends with: **the vertical slice** — sign
in, upload, deploy, call the live endpoint with an API key.

### Phase 4 — Observability and keys
API key issue/revoke (hash at rest, shown once). Gateway auth recording `ApiRequest`
rows. CloudWatch Logs tailing for the logs tab, request/latency/error charts for
monitoring, and generated OpenAPI docs per deployment from the stored tensor schema.

### Phase 5 — Deferred
Per-model CodeBuild images, autoscaling policies, GPU via EC2-backed ECS (Fargate has
no GPU, so `DeploymentConfig.gpu` stays schema-only until then), and deploying the
control plane itself to ECS.

## Risks

- **Terraform as a runtime dependency.** Concurrent applies on one state key corrupt
  it. Every deployment gets its own state key, DynamoDB locking is on from the first
  apply, and applies run one-at-a-time per deployment through the worker queue.
- **Cost drift.** The ALB and RDS bill whether or not anything is deployed. Budget
  roughly $35/mo idle. `scripts/` gets a teardown helper early.
- **Credentials.** The control plane holds AWS keys that can create infrastructure.
  Scope its IAM role narrowly from the start rather than attaching `PowerUserAccess`
  and promising to fix it later.
- **Untrusted models.** A `.onnx` file is a program. Runner tasks get no outbound
  network beyond S3, a read-only root filesystem, and their own minimal task role.

## Verification

Each phase ends with a check that exercises the real thing, not a mock:

1. **Phase 0** — `docker compose up -d && alembic upgrade head`, sign in via both
   providers, confirm `User` + `Account` rows.
2. **Phase 1** — upload a real `.onnx` (a small torchvision export), confirm the
   parsed signature in the UI matches `python -c "import onnx; ..."` locally.
3. **Phase 2** — `terraform plan` is clean and idempotent on a second run;
   `curl https://<domain>/healthz` on the hand-deployed service returns 200.
4. **Phase 3** — deploy through the UI, `aws ecs describe-services` shows the task
   healthy, `curl -H "Authorization: Bearer <key>"` returns a real inference result,
   then delete and confirm `terraform destroy` left nothing behind.
5. **Phase 4** — replay requests against a deployment, confirm `ApiRequest` rows and
   that the monitoring charts match the row counts.

## Prerequisites

Not yet present on this machine — all needed before Phase 2:

- `terraform` is not installed
- no AWS credentials are configured (`aws configure` / SSO)
- a domain is not yet registered
- Google and GitHub OAuth apps need to be created for their client IDs
