"""What a user looks like on the wire.

Mirrors the `User` interface in `frontend/types/api.ts`. The model has more
columns than this on purpose — a schema is what you choose to expose, not a
reflection of the table.
"""

from datetime import datetime

from app.schemas.base import CamelModel


class UserRead(CamelModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
    created_at: datetime
