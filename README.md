# Aegis

Upload an ONNX model, get a deployed HTTPS API behind an API key.

Built as a hands-on way to learn Terraform and AWS. See [PLAN.md](./PLAN.md)
for architecture and decisions, and [docs/](./docs) for deeper notes.

## Layout

| Path        | What lives here                                              |
|-------------|--------------------------------------------------------------|
| `frontend/` | Next.js 16 dashboard. Frontend only — no API routes.          |
| `backend/`  | FastAPI control plane. Owns auth, data, and Terraform runs.   |
| `runner/`   | The one shared ONNX serving image every deployment runs.      |
| `infra/`    | Terraform: `baseline/` by hand, `modules/deployment/` by API. |
