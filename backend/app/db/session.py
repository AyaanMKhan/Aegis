"""Engine, session factory, and the dependency routes use to get a session.

One engine for the process (it owns the connection pool), one short-lived
session per request. The session is the unit of work: it tracks what you
changed and writes it on commit.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# postgresql+psycopg:// resolves to psycopg 3, which speaks both sync and async.
# create_async_engine picks the async side; alembic's create_engine picks the
# sync side, from the very same URL string.
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: open a session, hand it over, always close it.

    `expire_on_commit=False` on the factory means objects stay readable after
    commit — without it, touching `user.email` after a commit would fire
    another SELECT, and in async code that raises instead of quietly working.
    """
    async with SessionLocal() as session:
        yield session
