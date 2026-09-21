from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.core.ids import new_id
from app.db.base import Base, TimestampMixin


class Project(TimestampMixin, Base):
    """The top-level container a user's models and deployments hang off."""

    __tablename__ = "projects"
    __table_args__ = (
        # Slugs are unique per user, not globally — two people may both have a
        # "vision-pipeline", and the URL is always scoped to the signed-in user.
        UniqueConstraint("user_id", "slug", name="uq_projects_user_slug"),
    )

    id = Column(String(32), primary_key=True, default=lambda: new_id("prj"))
    user_id = Column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    name = Column(String(120), nullable=False)
    slug = Column(String(140), nullable=False)
    description = Column(Text, nullable=True)

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="projects")
