"""
Self-registration with the central Directory Service.

Only relevant when DEPLOYMENT_MODE=SINGLE_TENANT (see config/settings.py and
DirectoryService/README.md). On every startup, this server looks up its own
representative's profile — the one REPRESENTATIVE user living in its own,
dedicated database — and tells the Directory Service its REP_SERVER_URL, so
the mobile app (and citizens choosing this representative) can find it.

Safe to call in MULTI_TENANT mode too: it's a no-op unless DEPLOYMENT_MODE,
DIRECTORY_SERVICE_URL, REP_SERVER_URL and DIRECTORY_REGISTER_KEY are all set.
"""
import logging

import requests
from config.database import MongoDatabase
from config.settings import settings

logger = logging.getLogger(__name__)


def register_with_directory() -> None:
    if settings.DEPLOYMENT_MODE != "SINGLE_TENANT":
        return
    missing = [
        name for name, val in (
            ("DIRECTORY_SERVICE_URL", settings.DIRECTORY_SERVICE_URL),
            ("REP_SERVER_URL", settings.REP_SERVER_URL),
            ("DIRECTORY_REGISTER_KEY", settings.DIRECTORY_REGISTER_KEY),
        ) if not val
    ]
    if missing:
        logger.warning(
            f"Skipping Directory Service self-registration — missing: {', '.join(missing)}. "
            "This server won't be reachable from the app until these are set."
        )
        return

    db = MongoDatabase.get_db()
    rep = db.users.find_one({"role": "REPRESENTATIVE"})
    if not rep:
        logger.warning(
            "No REPRESENTATIVE user found in this server's database yet — "
            "run create_representative.py (or equivalent setup) first, then "
            "restart this server so it can self-register."
        )
        return

    payload = {
        "name":               rep.get("fullName", ""),
        "rep_type":           (rep.get("title") or "").strip().upper(),
        "server_url":         settings.REP_SERVER_URL,
        "assembly_name":      rep.get("assembly_name") or None,
        "parliamentary_name": rep.get("parliamentary_name") or None,
        "ward_id":            rep.get("ward_id") or None,
        "ward_name":          rep.get("ward_name") or None,
        "taluk":              rep.get("taluk") or None,
        "district":           rep.get("district") or None,
        "state":              rep.get("state") or None,
    }

    try:
        resp = requests.post(
            f"{settings.DIRECTORY_SERVICE_URL.rstrip('/')}/api/directory/register",
            json=payload,
            headers={"X-Directory-Key": settings.DIRECTORY_REGISTER_KEY},
            timeout=10,
        )
        if resp.status_code == 200:
            logger.info(
                f"Registered with Directory Service: {payload['rep_type']} "
                f"'{payload['name']}' -> {payload['server_url']}"
            )
        else:
            logger.error(f"Directory Service registration failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Could not reach Directory Service to self-register: {e}")
