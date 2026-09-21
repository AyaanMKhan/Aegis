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
