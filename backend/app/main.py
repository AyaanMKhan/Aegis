from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.routes import auth
from app.core.config import settings

app = FastAPI(title="Aegis")

# Middleware is applied outermost-last, so CORS wraps the session layer and
# gets to answer preflight requests before anything else runs.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    session_cookie="aegis_session",
    max_age=14 * 24 * 60 * 60,
    same_site="lax",
    # localhost is plain http in development; over HTTPS this must be True.
    https_only=settings.backend_origin.startswith("https://"),
)

app.add_middleware(
    CORSMiddleware,
    # A credentialed request cannot use a wildcard origin — the browser
    # requires the exact origin echoed back, so this is an explicit list.
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
