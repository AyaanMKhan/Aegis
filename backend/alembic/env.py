"""Alembic's entry point — the bridge between the app and the migration tool.

Three things happen here that the generated template does not do for you:

1. the database URL comes from `app.core.config`, not `alembic.ini`
2. `app.models` is imported, so every table is registered on `Base.metadata`
3. `target_metadata` is set to that metadata, which is what autogenerate
   compares the live database against

The engine here is a plain synchronous one. The app runs SQLAlchemy in async
mode, but migrations are a one-at-a-time script, so there is nothing to gain
from async — and `postgresql+psycopg://` is the same URL either way, because
psycopg 3 speaks both.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.db.base import Base

# Importing the package registers User, Account and Project on Base.metadata.
# Without this line autogenerate sees an empty schema and writes a migration
# that drops every table.
import app.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Render SQL to stdout instead of running it — `alembic upgrade --sql`."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Connect and run the migrations inside one transaction."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Notice a VARCHAR(120) that became VARCHAR(200); off by default.
            compare_type=True,
            # Notice a default added or removed on a column.
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
