# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Backend (FastAPI)
# Build context is the repo root; only ./backend is copied into the image.
# ---------------------------------------------------------------------------
ARG PYTHON_VERSION=3.15
FROM python:${PYTHON_VERSION}-slim AS backend

# Don't write .pyc files and don't buffer stdout/stderr (so logs show up immediately).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Non-root user to run the app.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install dependencies listed in backend/pyproject.toml in their own layer so
# they're cached until pyproject.toml changes. We read the dependency list
# directly instead of `pip install .` because the backend uses a flat layout
# (models/, routes/, schemas/ at the top level), which setuptools refuses to
# package without extra config.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=backend/pyproject.toml,target=/tmp/pyproject.toml \
    python -c "import tomllib; print('\n'.join(tomllib.load(open('/tmp/pyproject.toml','rb'))['project']['dependencies']))" > /tmp/requirements.txt \
    && pip install -r /tmp/requirements.txt

# Copy the backend source. main.py does `from routes import ...`, so the
# backend folder's contents live directly in /app.
COPY --chown=appuser:appuser backend/ .

USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
