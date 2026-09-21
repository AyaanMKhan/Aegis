"""Google sign-in.

Two endpoints do the whole dance:

  GET /auth/google/login     -> 302 to Google, with a one-time `state` stashed
                                in the session cookie
  GET /auth/google/callback  -> Google returns here with `?code=...&state=...`;
                                we swap the code for tokens, read the claims,
                                find-or-create the user, and set the cookie

The browser is then sent to the dashboard. The frontend never sees the code or
the tokens — they are exchanged server to server, and all the browser ever
holds is the signed session cookie.
"""

from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SESSION_USER_KEY, get_current_user
from app.core.config import settings
from app.core.oauth import oauth
from app.db.session import get_db
from app.models import Account, OAuthProvider, User
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/login")
async def google_login(request: Request):
    if not settings.google_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on this server",
        )

    # Must match a redirect URI registered in the Google console exactly.
    redirect_uri = f"{settings.backend_origin}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # Verifies `state`, POSTs the code to Google's token endpoint, and
        # validates the ID token's signature against Google's JWKS.
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as exc:
        query = urlencode({"error": exc.error or "oauth_failed"})
        return RedirectResponse(f"{settings.frontend_origin}/login?{query}")

    claims = token.get("userinfo") or {}
    email = (claims.get("email") or "").lower()

    # The whole find-or-create below trusts this address. Without the check, a
    # provider account holding an unverified address could be used to take over
    # an existing Aegis user by matching their email.
    if not email or not claims.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google account has no verified email address",
        )

    user = await _find_or_create_user(db, claims, email)

    request.session[SESSION_USER_KEY] = user.id
    return RedirectResponse(
        f"{settings.frontend_origin}/dashboard", status_code=status.HTTP_303_SEE_OTHER
    )


async def _find_or_create_user(
    db: AsyncSession, claims: dict, email: str
) -> User:
    """Resolve Google's claims to a user row, creating what is missing.

    Three cases, in order:
      1. We have seen this Google `sub` before  -> that account's user.
      2. New `sub`, but the verified email matches an existing user -> link a
         second account row to them (this is what makes "either provider lands
         on the same account" true once GitHub is added).
      3. Neither -> a brand new user and their first account.
    """
    subject = claims["sub"]

    account = (
        await db.scalars(
            select(Account).where(
                Account.provider == OAuthProvider.GOOGLE,
                Account.provider_account_id == subject,
            )
        )
    ).first()

    if account is not None:
        user = await db.get(User, account.user_id)
        # Cheap profile refresh: names and avatars change upstream.
        user.name = claims.get("name") or user.name
        user.avatar_url = claims.get("picture") or user.avatar_url
        await db.commit()
        return user

    user = (await db.scalars(select(User).where(User.email == email))).first()

    if user is None:
        user = User(
            email=email,
            name=claims.get("name") or email.split("@")[0],
            avatar_url=claims.get("picture"),
        )
        db.add(user)
        # flush, not commit: sends the INSERT so user.id exists for the FK
        # below, while leaving both rows in one transaction.
        await db.flush()

    db.add(
        Account(
            user_id=user.id,
            provider=OAuthProvider.GOOGLE,
            provider_account_id=subject,
        )
    )
    await db.commit()
    return user


@router.get("/me", response_model=UserRead)
async def read_current_user(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request) -> Response:
    request.session.clear()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
