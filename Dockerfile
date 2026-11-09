FROM python:3.15-alpine

WORKDIR /backend

COPY pyproject.toml ./backend/
RUN pip install ./backend

COPY backend/ ./backend/

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]