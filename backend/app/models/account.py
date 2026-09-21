from enum import StrEnum

from sqlalchemy import Column, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.ids import new_id
from app.db.base import Base, TimestampMixin


class OAuthProvider(StrEnum):
    GOOGLE = "google"
    GITHUB = "github"


class Account(TimestampMixin, Base):
    """One OAuth identity belonging to a user.

    Google's `sub` claim goes in `provider_account_id`. It is the only stable
    handle Google gives you — an address can change, `sub` cannot — so it is
    what a returning user is looked up by.
    """

    __tablename__ = "accounts"
    __table_args__ = (
        # The same Google identity can never attach to two users.
        UniqueConstraint(
            "provider", "provider_account_id", name="uq_accounts_provider_account"
        ),
    )

    id = Column(String(32), primary_key=True, default=lambda: new_id("acc"))
    user_id = Column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # native_enum=False stores VARCHAR + a CHECK constraint rather than a
    # Postgres ENUM type. Adding "gitlab" later is then an ordinary migration
    # instead of an ALTER TYPE that cannot be rolled back.
    #
    # values_callable is the one that catches people out: left off, SQLAlchemy
    # stores the enum *member name* — "GOOGLE" — while every other layer,
    # including the JSON the frontend reads, says "google".
    provider = Column(
        Enum(
            OAuthProvider,
            name="oauth_provider",
            native_enum=False,
            create_constraint=True,
            length=32,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    provider_account_id = Column(String(255), nullable=False)

    user = relationship("User", back_populates="accounts")
