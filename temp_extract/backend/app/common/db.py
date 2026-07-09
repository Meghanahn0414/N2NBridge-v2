from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.settings import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@contextmanager
def tenant_session(tenant_id: str):
    """A DB session scoped to one tenant via Postgres row-level security.

    Sets `app.current_tenant`, which the RLS policies in db/rls.sql read, so a
    query can never return another tenant's rows.
    """
    db = SessionLocal()
    try:
        db.execute(text("SET app.current_tenant = :tid"), {"tid": tenant_id})
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def system_session():
    """Unscoped session for operations that run above tenancy (e.g. creating a
    tenant during provisioning). Use sparingly."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
