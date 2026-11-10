from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
import uuid



class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=False, nullable=False, index=True)
    project_ids = Column(UUID(as_uuid=True), ForeignKey("projects.id"), unique=True, nullable=True)