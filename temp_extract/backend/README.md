# N2Bridge — Central Platform (backend)

Multi-tenant **modular monolith** for the citizen grievance platform.
FastAPI · SQLAlchemy 2.0 · PostgreSQL (row-level security) · Redis · OTP + JWT · FCM/APNs.

> Reference skeleton generated from the architecture & backend-code design docs.
> Happy-path code — harden before production (see "Next steps" below).

## Layout

```
main.py                      FastAPI app, mounts every router
app/
├── settings.py              env / secrets (pydantic-settings)
├── common/
│   ├── base.py              SQLAlchemy DeclarativeBase
│   ├── db.py                engine, session, RLS helper (tenant_session)
│   ├── deps.py              get_current_user / get_db dependency
│   └── security.py          JWT encode / decode
├── auth/                    OTP + JWT
├── citizens/                citizen registry + cases (mobile-facing)
├── tenants/                 per-tenant runtime data (roles, categories)
├── directory/               tenant registry (config, read-heavy)
├── subscriptions/           billing + customer accounts
├── onboarding/              tenant provisioning
├── notifications/           FCM / APNs + device registry
└── admin/                   admin portal API
```

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, ...
uvicorn main:app --reload
```

Open http://localhost:8000/docs for the OpenAPI UI.

## Multi-tenancy

Every request carries a JWT with a tenant id (`tid`). `common/deps.get_db` opens a
DB session and sets `app.current_tenant`; Postgres row-level security policies scope
every query to that tenant. See `db/rls.sql` for the policies to apply after migrating.

## Next steps to production

- Alembic migrations (`alembic init`) instead of `create_all`.
- Move OTP + push delivery to a Celery/ARQ worker on Redis.
- Add pytest coverage around the tenant-isolation dependency.
- Rate-limit the OTP endpoints; add request validation everywhere.
- Load secrets from the cloud vault, not `.env`.
