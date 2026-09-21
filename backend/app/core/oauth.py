"""The Authlib client registry.

`server_metadata_url` is the OpenID Connect discovery document. Authlib fetches
it on first use and learns the authorization endpoint, the token endpoint and —
the part that matters — the JWKS URL, which is how it verifies the signature on
the ID token Google sends back. Nothing here is hardcoded to a Google URL
beyond that one document.
"""

from authlib.integrations.starlette_client import OAuth

from app.core.config import settings

oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    # openid -> an ID token at all; email and profile -> the claims we store.
    client_kwargs={"scope": "openid email profile"},
)

# GitHub is plain OAuth 2, not OpenID Connect: no discovery document, no ID
# token, so all three endpoints are named by hand and the profile is fetched
# from the API afterwards rather than read out of a signed token.
oauth.register(
    name="github",
    client_id=settings.github_client_id,
    client_secret=settings.github_client_secret,
    authorize_url="https://github.com/login/oauth/authorize",
    access_token_url="https://github.com/login/oauth/access_token",
    api_base_url="https://api.github.com/",
    # user:email is what makes /user/emails readable — a GitHub profile's
    # public email is usually null, and only that endpoint carries `verified`.
    client_kwargs={"scope": "read:user user:email"},
)
