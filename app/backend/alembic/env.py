from logging.config import fileConfig
from pathlib import Path
import os

from alembic import context
from dotenv import load_dotenv
from lib.postgres import Base
from models.supabase import RiskAssessment, StudentRecord, UserProfile

load_dotenv(Path(__file__).parent.parent / ".env")
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
sync_url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql+psycopg2://")
config.set_main_option("sqlalchemy.url", sync_url.replace("%", "%%"))
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    connectable = create_engine(config.get_main_option("sqlalchemy.url"), pool_pre_ping=True)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()