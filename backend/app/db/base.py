"""The declarative base every model inherits, plus the shared column mixin.

Importing this module is not enough for Alembic to see the tables — a model
class has to be imported for it to register itself on Base.metadata. That is
what `app/models/__init__.py` is for.
"""

from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Holds the metadata (the table catalogue) Alembic diffs against."""


class TimestampMixin:
    """`created_at` on every table, stamped by Postgres rather than Python.

    `server_default=func.now()` becomes DEFAULT now() in the DDL, so a row
    inserted by hand in psql is timestamped too. timezone=True stores
    TIMESTAMPTZ — the value is UTC and carries that fact with it, which is what
    makes the ISO strings the frontend renders unambiguous.

    A plain Column on a mixin is copied onto each mapped class, so the three
    tables each get their own.
    """

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
