"""Dependencies shared by routes.

`get_current_user` is the gate every private endpoint sits behind. It reads the
id out of the signed session cookie and loads the row; a tampered or expired
cookie never decodes, so a request either has a real user or gets a 401.
"""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User

SESSION_USER_KEY = "user_id"


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    user_id = request.session.get(SESSION_USER_KEY)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    user = await db.get(User, user_id)
    if user is None:
        # Cookie outlived the row it points at — drop it rather than 500.
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session no longer valid"
        )

    return user
