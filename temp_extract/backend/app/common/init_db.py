"""Dev helper: create all tables, then print a reminder to apply RLS.

    python -m app.common.init_db

For production use Alembic migrations instead.
"""
from app.common.base import Base
from app.common.db import engine

# Import every module's models so they register on Base.metadata.
from app.auth import models as _auth  # noqa: F401
from app.citizens import models as _citizens  # noqa: F401
from app.tenants import models as _tenants  # noqa: F401
from app.subscriptions import models as _subs  # noqa: F401
from app.notifications import models as _notif  # noqa: F401


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Tables created. Now apply row-level security:")
    print("  psql $DATABASE_URL -f db/rls.sql")


if __name__ == "__main__":
    main()
