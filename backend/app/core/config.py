"""Settings, read once from the environment at import time.

Nothing in the app reads os.environ directly — everything goes through this
object, so the full set of knobs is visible in one place and a missing one
fails loudly at startup instead of deep inside a request.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # postgresql+psycopg:// — psycopg 3, used both async (the app) and sync
    # (alembic) from this one URL.
    database_url: str

    # Where the browser is. Used for the CORS allow-list and as the redirect
    # target once a sign-in completes.
    frontend_origin: str = "http://localhost:3000"

    # Where the OAuth provider sends the browser back to. Must match the
    # redirect URI registered in the Google console, character for character.
    backend_origin: str = "http://localhost:8000"

    # Signs the session cookie. Rotating it logs everybody out.
    session_secret: str

    google_client_id: str = ""
    google_client_secret: str = ""

    github_client_id: str = ""
    github_client_secret: str = ""

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def github_configured(self) -> bool:
        return bool(self.github_client_id and self.github_client_secret)


settings = Settings()
