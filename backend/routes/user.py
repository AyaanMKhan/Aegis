from fastapi import APIRouter



user_router = APIRouter()


@user_router.post("/user/create")
async def create_user():
    return {"User : Created"}