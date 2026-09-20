# Aegis

Upload an ONNX model, get a deployed HTTPS API behind an API key.

Built as a hands-on way to learn Terraform and AWS. See [PLAN.md](./PLAN.md) for
architecture, decisions, and the phase order.

## Layout

Only the phase in progress is scaffolded — empty folders fill in when their phase
starts. Phase 0 (local foundation) is current.

| Path        | What lives here                                        | State       |
|-------------|--------------------------------------------------------|-------------|
| `frontend/` | Next.js 16 dashboard. Frontend only — no API routes.    | Built, mock data |
| `backend/`  | FastAPI control plane. Auth, data, Terraform runs.      | Phase 0 skeleton |
| `infra/`    | Terraform — `baseline/` by hand, `modules/` by the API. | Phase 2     |
| `runner/`   | The one shared ONNX serving image every deployment runs.| Phase 3     |
| `docs/`     | Notes worth keeping, written as they are earned.         | empty       |
| `scripts/`  | Operational helpers, starting with AWS teardown.         | Phase 2     |

## Running locally

```sh
docker compose up -d          # Postgres on :5432
cd frontend && npm run dev    # dashboard on :3000
```
