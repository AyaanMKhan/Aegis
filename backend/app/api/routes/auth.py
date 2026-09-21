"""Sign-in with Google and GitHub.

Each provider gets two endpoints:

  GET /auth/<provider>/login     -> 302 to the provider, with a one-time
                                    `state` stashed in the session cookie
  GET /auth/<provider>/callback  -> the provider returns here with
                                    `?code=...&state=...`; we swap the code for
                                    tokens, read the profile, find-or-create
                                    the user, and set the cookie

The browser is then sent to the dashboard. The frontend never sees the code or
the tokens — they are exchanged server to server, and all the browser ever
holds is the signed session cookie.

The two providers differ in exactly one place: how a verified email address and
a stable account id are obtained. Google hands both over as claims in a signed
ID token. GitHub has no ID token, so its profile and addresses are fetched from
the API. Once both have produced the same four facts — subject, email, name,
avatar — they converge on `_find_or_create_user`.
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


# --------------------------------------------------------------------- google


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
        return _back_to_login(exc)

    claims = token.get("userinfo") or {}
    email = (claims.get("email") or "").lower()

    # The find-or-create below trusts this address. Without the check, a
    # provider account holding an unverified address could be used to take over
    # an existing Aegis user by matching their email.
    if not email or not claims.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google account has no verified email address",
        )

    user = await _find_or_create_user(
        db,
        provider=OAuthProvider.GOOGLE,
        subject=claims["sub"],
        email=email,
        name=claims.get("name") or email.split("@")[0],
        avatar_url=claims.get("picture"),
    )
    return _complete_sign_in(request, user)


# --------------------------------------------------------------------- github


@router.get("/github/login")
async def github_login(request: Request):
    if not settings.github_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub sign-in is not configured on this server",
        )

    redirect_uri = f"{settings.backend_origin}/auth/github/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback")
async def github_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await oauth.github.authorize_access_token(request)
    except OAuthError as exc:
        return _back_to_login(exc)

    profile = (await oauth.github.get("user", token=token)).json()

    # GitHub's numeric id is the stable handle — a login can be renamed, and
    # the old name then becomes available for somebody else to claim.
    subject = str(profile["id"])

    email = await _github_verified_email(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="GitHub account has no verified email address",
        )

    user = await _find_or_create_user(
        db,
        provider=OAuthProvider.GITHUB,
        subject=subject,
        email=email,
        name=profile.get("name") or profile.get("login") or email.split("@")[0],
        avatar_url=profile.get("avatar_url"),
    )
    return _complete_sign_in(request, user)


async def _github_verified_email(token: dict) -> str | None:
    """Pick the address to trust out of `GET /user/emails`.

    The profile's own `email` field is skipped deliberately: it is whatever the
    user set as publicly visible, it is frequently null, and it carries no
    verification flag. This endpoint is the only one that says `verified`.
    """
    addresses = (await oauth.github.get("user/emails", token=token)).json()
    verified = [entry for entry in addresses if entry.get("verified")]

    for entry in verified:
        if entry.get("primary"):
            return entry["email"].lower()

    return verified[0]["email"].lower() if verified else None


# --------------------------------------------------------------------- shared


async def _find_or_create_user(
    db: AsyncSession,
    *,
    provider: OAuthProvider,
    subject: str,
    email: str,
    name: str,
    avatar_url: str | None,
) -> User:
    """Resolve a provider identity to a user row, creating what is missing.

    Three cases, in order:
      1. We have seen this provider account before -> that account's user.
      2. New provider account, but the verified email matches an existing user
         -> link a second account row to them. This is what makes signing in
         with Google and later with GitHub land on one account.
      3. Neither -> a brand new user and their first account.
    """
    account = (
        await db.scalars(
            select(Account).where(
                Account.provider == provider,
                Account.provider_account_id == subject,
            )
        )
    ).first()

    if account is not None:
        user = await db.get(User, account.user_id)
        # Cheap profile refresh: names and avatars change upstream.
        user.name = name or user.name
        user.avatar_url = avatar_url or user.avatar_url
        await db.commit()
        return user

    user = (await db.scalars(select(User).where(User.email == email))).first()

    if user is None:
        user = User(email=email, name=name, avatar_url=avatar_url)
        db.add(user)
        # flush, not commit: sends the INSERT so user.id exists for the FK
        # below, while leaving both rows in one transaction.
        await db.flush()

    db.add(
        Account(user_id=user.id, provider=provider, provider_account_id=subject)
    )
    await db.commit()
    return user


def _complete_sign_in(request: Request, user: User) -> RedirectResponse:
    request.session[SESSION_USER_KEY] = user.id
    return RedirectResponse(
        f"{settings.frontend_origin}/dashboard", status_code=status.HTTP_303_SEE_OTHER
    )


def _back_to_login(exc: OAuthError) -> RedirectResponse:
    query = urlencode({"error": exc.error or "oauth_failed"})
    return RedirectResponse(f"{settings.frontend_origin}/login?{query}")


@router.get("/me", response_model=UserRead)
async def read_current_user(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request) -> Response:
    request.session.clear()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
