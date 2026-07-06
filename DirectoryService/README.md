# N2N Directory Service

The one fixed, always-reachable service the mobile app and every
representative's server use to answer: **"which server handles Ward X /
Assembly Y / Parliamentary Z?"**

It stores **only routing data** — no citizens, no grievances, no
representative logins. Just: `rep_type + constituency identifier -> server_url`.

## Why this exists

Each MLA / MP / Councillor now runs on a completely separate server with a
completely separate MongoDB (see `../Backend`, run in
`DEPLOYMENT_MODE=SINGLE_TENANT`). One representative's server can never see
another's data. But the mobile app is a single app that a citizen uses to
reach whichever representative they choose — so something has to tell the
app where each representative's server actually lives. That's this service.

## Endpoints

- `GET /api/directory/constituencies?rep_type=MLA` — dropdown data for the
  app's "choose your representative" screen (also works for `MP`, `COUNCILLOR`).
- `GET /api/directory/resolve?rep_type=MLA&assembly_name=...` — returns the
  matching representative's summary **and `server_url`**. The app then talks
  directly to that URL for registration, login, grievances, everything.
  Use `parliamentary_name=` for MP, `ward_id=` for COUNCILLOR.
- `POST /api/directory/register` — a representative's server calls this
  (see `Backend`'s startup self-registration) to add/update its own entry.
  Requires header `X-Directory-Key: <DIRECTORY_REGISTER_KEY>`.

## Run locally

```bash
cd DirectoryService
python -m venv .venv
.venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env     # edit MONGODB_URL and DIRECTORY_REGISTER_KEY
python main.py           # serves on http://localhost:9000, docs at /api/docs
```

## Deploying

Deploy this once, centrally (Render/Fly/a small VM/etc.), with its own small
MongoDB (a free-tier Atlas cluster is plenty — this collection stays tiny).
Its public URL is the ONE thing that must stay constant and get baked into
every mobile app build (`EXPO_PUBLIC_DIRECTORY_URL`) and every
representative server's `.env` (`DIRECTORY_SERVICE_URL`).

Set a strong, random `DIRECTORY_REGISTER_KEY` and give the same value to
every representative server — that's what stops a random party from
registering a fake server_url for someone else's constituency.
