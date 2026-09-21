from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from app.core.ids import new_id
from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    """A person. Owns everything else in the system.

    A user has no password column and never will — identity comes entirely
    from an OAuth provider, which is what the `accounts` rows record.
    """

    __tablename__ = "users"

    id = Column(String(32), primary_key=True, default=lambda: new_id("usr"))

    # The identity key across providers: signing in with Google and later with
    # GitHub on the same verified address lands on this one row.
    email = Column(String(320), unique=True, nullable=False)

    name = Column(String(200), nullable=False)
    avatar_url = Column(String(1024), nullable=True)

    # Related classes are named as strings so the import order never matters.
    accounts = relationship(
        "Account", back_populates="user", cascade="all, delete-orphan"
    )
    projects = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )
