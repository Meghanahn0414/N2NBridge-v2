# N2N Lookup Service

The one fixed, always-reachable service the mobile app and every
representative's server use to answer: **"which server handles Ward X /
Assembly Y / Parliamentary Z?"**

It stores **only routing data** — no citizens, no grievances, no
representative logins. Just: `rep_type + constituency identifier -> server_url`
(plus an optional `db_url` — see security note below).

## Why this exists

Each MLA / MP / Councillor now runs on a completely separate server with a
completely separate MongoDB (see `../Backend`, run in
`DEPLOYMENT_MODE=SINGLE_TENANT`). One representative's server can never see
another's data. But the mobile app is a single app that a citizen uses to
reach whichever representative they choose — so something has to tell the
app where each representative's server actually lives. That's this service.

## Endpoints

- `GET /api/lookup/constituencies?rep_type=MLA` — dropdown data for the
  app's "choose your representative" screen (also works for `MP`, `COUNCILLOR`).
- `GET /api/lookup/resolve?rep_type=MLA&assembly_name=...` — returns the
  matching representative's summary **and `server_url`**. The app then talks
  directly to that URL for registration, login, grievances, everything.
  Use `parliamentary_name=` for MP, `ward_id=` for COUNCILLOR.
- `POST /api/lookup/register` — a representative's server calls this
  (see `Backend`'s startup self-registration) to add/update its own entry.
  Requires header `X-Lookup-Key: <LOOKUP_REGISTER_KEY>`.
- `GET /api/lookup/representatives` — admin/debug listing of every
  registered representative with full details, including `server_url` and
  `db_url`. Requires header `X-Lookup-Key: <LOOKUP_REGISTER_KEY>`.

## ⚠️ Security note on `db_url`

Each representative's server now also sends its own MongoDB connection
string (`db_url`) on registration, and it's stored alongside the routing
entry. That string typically embeds a username/password, so anyone with
`LOOKUP_REGISTER_KEY` (which every representative deployment holds) can call
`GET /api/lookup/representatives` and read every representative's raw DB
credentials. Keep `LOOKUP_REGISTER_KEY` as secret as a database password,
restrict who gets it, and consider rotating it if you ever suspect it's
leaked. If you'd rather not centralize this risk, you can leave `db_url`
unset on the representative's `.env` — it's optional, and everything else
(constituency lookup, resolve, registration) works fine without it.

## Run locally

```bash
cd LookupService
python -m venv .venv
.venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env     # edit MONGODB_URL and LOOKUP_REGISTER_KEY
python main.py           # serves on http://localhost:9000, docs at /api/docs
```

## Deploying

Deploy this once, centrally (Render/Fly/a small VM/etc.), with its own small
MongoDB (a free-tier Atlas cluster is plenty — this collection stays tiny).
Its public URL is the ONE thing that must stay constant and get baked into
every mobile app build (`EXPO_PUBLIC_LOOKUP_URL`) and every
representative server's `.env` (`LOOKUP_SERVICE_URL`).

Set a strong, random `LOOKUP_REGISTER_KEY` and give the same value to
every representative server — that's what stops a random party from
registering a fake server_url for someone else's constituency.
