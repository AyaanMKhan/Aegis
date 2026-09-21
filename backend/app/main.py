from fastapi import FastAPI

app = FastAPI(title="Aegis")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
