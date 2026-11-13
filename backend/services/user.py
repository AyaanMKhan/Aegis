from database import get_db
from schemas.user import UserResponse, UserCreate
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from models.user import User
from models.project import Project



def create_user(user: UserCreate, db : Session = Depends(get_db)):

    exisitng_user = db.query(User).filter(User.id == user.id).first()

    if exisitng_user:
        raise HTTPException(status_code=400, detail="User already exists in database")


    if user.project_ids:
        taken = db.query(User).filter(User.project_ids == user.project_ids).first()

        if taken:
            raise HTTPException(status_code=400, detail="Project is taken from another user")

    new_user = User(id=user.id, username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user