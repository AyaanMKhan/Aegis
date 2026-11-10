import os

from sqlalchemy import create_engine
# DeclarativeBase is required for the "Base" class in SQLAlchemy 2.0+
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Uses Postgres in Docker when DATABASE_URL is provided, otherwise local SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# 2. Create the session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create the Base class that your code is trying to import
class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()