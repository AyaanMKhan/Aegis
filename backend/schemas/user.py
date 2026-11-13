from pydantic import ConfigDict, Field, BaseModel
from uuid import UUID
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    model_config = ConfigDict(str_max_length=50, populate_by_name=True)

    id: UUID
    username: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


    id: UUID
    username: str
    project_ids: Optional[UUID] = None