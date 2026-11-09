from fastapi import APIRouter


project_router = APIRouter()


@project_router.post("project/create")
async def create_project():
    return {"Project" : "Created"}