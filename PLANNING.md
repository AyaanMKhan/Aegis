# Aegis: Planning and Status

_Last assessed: 2026-10-07, at commit `b20c9f6` ("frontend bug")._

The design and the reasons behind it are in [PLAN.md](./PLAN.md). This file is the
checklist: each component broken into steps small enough to code in one sitting.
Tick a box when the step works, then update the percentages below.

## Overall completion: about 20%

Each component has a weight (how much of the finished product it represents). Its
completion is the share of its boxes that are ticked. Overall = sum of weight ×
completion.

| # | Component | Phase | Weight | Done | Contributes |
|---|---|---|---:|---:|---:|
| 1 | Local dev environment | 0 | 4 | 5/6 (83%) | 3.3 |
| 2 | Database and Phase 0 tables | 0 | 5 | 7/8 (88%) | 4.4 |
| 3 | Sign in: backend | 0 | 8 | 7/9 (78%) | 6.2 |
| 4 | Sign in: frontend wiring | 0 | 6 | 1/8 (13%) | 0.8 |
| 5 | Projects API | 0 | 6 | 0/7 (0%) | 0 |
| 6 | Projects UI wired to API | 0 | 4 | 0/5 (0%) | 0 |
| 7 | Frontend screens (mock data) | 0 | 5 | 4/4 (100%) | 5.0 |
| 8 | Model upload and inspection | 1 | 12 | 0/9 (0%) | 0 |
| 9 | Baseline AWS infrastructure | 2 | 18 | 0/13 (0%) | 0 |
| 10 | Runner and deployments | 3 | 20 | 0/12 (0%) | 0 |
| 11 | API keys and observability | 4 | 12 | 0/9 (0%) | 0 |
| | **Total** | | **100** | | **≈ 20%** |

**Phase 0 alone is about 59% done** (19.7 of its 38 weight points). Next up: the
frontend sign-in wiring (component 4), then projects (5 and 6).

---

## Phase 0: Local foundation

### 1. Local dev environment: 83%
- [x] `docker-compose.yml` with `db`, `backend`, `frontend`
- [x] Postgres healthcheck, and backend waits for it
- [x] `GET /healthz` (`backend/app/main.py`)
- [x] `app/core/config.py` reads every setting from the environment
- [x] `backend/.env.example` documents every secret
- [ ] Migrations run on backend start, or the README says to run `alembic upgrade head`

### 2. Database and Phase 0 tables: 88%
- [x] `app/db/session.py`: async engine and `get_db` dependency
- [x] `app/db/base.py`: `Base` and `TimestampMixin`
- [x] `User` model
- [x] `Account` model, unique on (provider, provider_account_id)
- [x] `Project` model, unique on (user_id, slug)
- [x] `app/models/__init__.py` imports every model, so Alembic can see them
- [x] Alembic set up, baseline migration generated
- [ ] Migration applied, tables checked with `\dt` in psql

### 3. Sign in: backend: 78%
- [x] Authlib registry for Google (OIDC) and GitHub (`app/core/oauth.py`)
- [x] `/auth/google/login` and `/auth/google/callback`, rejects unverified email
- [x] `/auth/github/login` and `/auth/github/callback`, reads `/user/emails` for a verified address
- [x] `_find_or_create_user` links a second provider to the same user by email
- [x] Signed session cookie (`SessionMiddleware`), CORS with credentials
- [x] `get_current_user` dependency returns 401 when signed out
- [x] `GET /auth/me` and `POST /auth/logout`
- [ ] Create the Google and GitHub OAuth apps, fill in `backend/.env` (it does not exist yet)
- [ ] Sign in with both providers, confirm one `users` row and two `accounts` rows

### 4. Sign in: frontend wiring: 13%
- [x] OAuth buttons link to the backend `/auth/<provider>/login`
- [ ] `lib/api.ts`: fetch wrapper with base URL, `credentials: "include"`, throws on non-2xx
- [ ] `lib/auth.ts`: `getCurrentUser()` calls `/auth/me` (in a server component, forward the cookie with `cookies()`)
- [ ] `app/dashboard/layout.tsx` redirects to `/login` on 401
- [ ] Topbar shows the real user instead of `mockUser`
- [ ] Sign-out button calls `POST /auth/logout`, then goes to `/login`
- [ ] Login page shows a message when the URL has `?error=`
- [ ] Remove or repurpose `app/(auth)/callback` (the backend redirects straight to `/dashboard`)

### 5. Projects API: 0%
- [ ] `app/schemas/project.py`: `ProjectRead` (including `modelCount` and `deploymentCount`) and `ProjectCreate`, matching `Project` in `frontend/types/api.ts`
- [ ] Slug helper: name to slug, add a suffix if the user already has that slug
- [ ] `app/api/routes/projects.py`: `GET /projects` returns only the current user's projects
- [ ] `POST /projects`
- [ ] `GET /projects/{id}` returns 404 if the project belongs to someone else
- [ ] Register the router in `main.py`
- [ ] Test it in `/docs` while signed in

### 6. Projects UI wired to API: 0%
- [ ] `dashboard/projects/page.tsx` lists projects from the API
- [ ] `new-project-form.tsx` POSTs, then redirects to the new project
- [ ] `dashboard/projects/[projectId]/page.tsx` loads from the API
- [ ] Dashboard overview shows the real project count
- [ ] **Phase 0 check:** sign in, create a project, reload, it is still there

### 7. Frontend screens (mock data): 100%
- [x] Marketing, login and signup pages
- [x] Dashboard, projects, models, deployments, API keys and settings screens
- [x] `types/api.ts` defines the API contract
- [x] `lib/mock-data.ts` holds the data each screen renders

---

## Phase 1: Model upload and inspection

### 8. Model upload and inspection: 0%
- [ ] `Model` and `ModelVersion` models, plus a migration
- [ ] Dev S3 bucket made by hand (Terraform takes it over in Phase 2), `boto3` and credentials in `.env`
- [ ] Bucket CORS allows `PUT` from `http://localhost:3000`
- [ ] `POST /projects/{id}/models` creates a `Model` and a `ModelVersion` (`uploading`), returns a presigned PUT URL
- [ ] `POST /model-versions/{id}/complete` downloads the file, parses it with `onnx`, saves framework, input/output schema, opset and checksum, sets the status to `ready`
- [ ] `GET /projects/{id}/models` and `GET /models/{id}`
- [ ] `model-upload-flow.tsx` uploads to the presigned URL, then calls `complete`
- [ ] Model page shows the real signature
- [ ] **Phase 1 check:** upload a small torchvision export, compare against `python -c "import onnx; ..."`

---

## Phase 2: Baseline infrastructure

### 9. Baseline AWS infrastructure: 0%
- [ ] Install `terraform`, configure AWS credentials, register a domain
- [ ] Remote state bucket and DynamoDB lock table (bootstrap)
- [ ] VPC with public and private subnets
- [ ] Security groups
- [ ] Shared ALB with an HTTPS listener
- [ ] Route 53 hosted zone and DNS-validated ACM certificate
- [ ] ECS cluster and ECR repository
- [ ] S3 model bucket (import the Phase 1 one)
- [ ] RDS Postgres
- [ ] IAM roles: task execution, runner task, control plane (narrowly scoped)
- [ ] `scripts/teardown.sh`
- [ ] Hand-deployed hello-world service, `curl https://<domain>/healthz` returns 200
- [ ] **Phase 2 check:** a second `terraform plan` shows no changes

---

## Phase 3: Programmatic deployment

### 10. Runner and deployments: 0%
- [ ] `runner/`: FastAPI app that loads `MODEL_S3_URI` at boot and serves `POST /predict` with `onnxruntime`
- [ ] Runner Dockerfile, run locally against a test model
- [ ] Build the runner image and push it to ECR
- [ ] `Deployment`, `DeploymentConfig` and `DeploymentEvent` models, plus a migration
- [ ] `infra/modules/deployment`: task definition, ECS service, target group, ALB listener rule
- [ ] Terraform service: render tfvars, `init` and `apply` with state key `deployments/<id>/terraform.tfstate`
- [ ] Background worker: one apply per deployment at a time, writes status and events
- [ ] `POST /deployments`, `GET` list and detail, `PATCH` config (re-applies)
- [ ] `DELETE /deployments/{id}` runs `terraform destroy`
- [ ] New-deployment form, deployments list and detail wired to the API
- [ ] Provisioning panel polls the status
- [ ] **Phase 3 check:** deploy, call the live endpoint, delete, confirm nothing is left in AWS

---

## Phase 4: Observability and keys

### 11. API keys and observability: 0%
- [ ] `ApiKey` model (`keyPrefix`, `keyHash`, `revokedAt`), plus a migration
- [ ] `POST /api-keys` (full key shown once), `GET /api-keys`, `DELETE /api-keys/{id}` (revoke)
- [ ] API keys page wired to the API
- [ ] Runner checks the key and records `ApiRequest` rows
- [ ] Logs tab tails CloudWatch Logs
- [ ] Monitoring charts built from `ApiRequest` rows
- [ ] Docs tab generates OpenAPI from the stored tensor schema
- [ ] Test page calls the real endpoint
- [ ] **Phase 4 check:** replay requests, chart counts match the `ApiRequest` rows

---

## Phase 5: Deferred (not counted)
- [ ] Per-model CodeBuild images, to measure the cold-start difference
- [ ] Autoscaling policies
- [ ] GPU on EC2-backed ECS
- [ ] Deploy the control plane itself to ECS
