from fastapi import FastAPI, APIRouter
from routes import user, project, models
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(title="Aegis")
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
async def hello():
    return {"message": "Hello World"}



app.include_router(user.user_router)
app.include_router(project.project_router)
app.include_router(models.models_router)