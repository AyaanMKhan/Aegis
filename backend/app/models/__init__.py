"""Every model is imported here so that importing `app.models` registers all
of them on `Base.metadata`.

Alembic's autogenerate compares the database against that metadata. A model
that nothing has imported is invisible to it, and the migration it writes will
silently drop the table instead of creating it.
"""

from app.models.account import Account, OAuthProvider
from app.models.project import Project
from app.models.user import User

__all__ = ["Account", "OAuthProvider", "Project", "User"]
