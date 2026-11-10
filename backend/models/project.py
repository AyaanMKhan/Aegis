from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
import uuid



class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), name="id", primary_key=True, default=uuid.uuid4)
    name = Column(String(30), unique=True, nullable=False, name="project_name")
    model_ids = Column(UUID(as_uuid=True), ForeignKey("models.id") ,nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())