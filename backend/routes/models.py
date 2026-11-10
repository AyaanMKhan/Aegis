from fastapi import APIRouter


models_router = APIRouter()



@models_router.post("models/create")
async def create_model():
    return {"Model" : "Created"}