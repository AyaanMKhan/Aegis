from fastapi import APIRouter, Depends, HTTPException
from services import user
from schemas.user import UserResponse, UserCreate
from database import get_db
from sqlalchemy.orm import Session

user_router = APIRouter()


@user_router.post("/user/create", status_code=201, response_model=UserResponse)
async def create_user(payload: UserCreate, db: Session = Depends(get_db)):

    try:
        return user.create_user(payload, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))