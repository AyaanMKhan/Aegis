# Dev image. Code is bind-mounted and uvicorn reloads on change; only the
# dependency layer is baked in.
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# uid 1000 matches the host user, so anything written into the bind mount
# (__pycache__, later alembic revisions) stays owned by you.
RUN useradd --uid 1000 --create-home app
USER app

COPY --chown=app:app . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
