"""
Registration with the central Lookup Service.

Two entry points, both safe no-ops unless LOOKUP_SERVICE_URL, REP_SERVER_URL,
and LOOKUP_REGISTER_KEY are all set in this server's own .env (most
deployments — the default shared/multi-tenant Backend — simply won't have
these configured, so this module does nothing there):

- register_representative_with_lookup(rep): call this the moment a new
  representative account is created (see auth/routes.py
  _create_representative_account), so they're reachable from the citizen
  app's Lookup Service flow immediately — no restart needed.

- register_with_lookup_service(): called once at server startup (see
  main.py's lifespan) as a fallback/resync for DEPLOYMENT_MODE=SINGLE_TENANT
  deployments — looks up the one REPRESENTATIVE user living in this server's
  own database and (re-)registers them. Mainly useful after a server was
  restarted with these settings added for the first time, or if a manual
  registration was ever missed.
"""
import logging

import requests
from config.database import MongoDatabase
from config.settings import settings

logger = logging.getLogger(__name__)


def _missing_lookup_config() -> list:
    return [
        name for name, val in (
            ("LOOKUP_SERVICE_URL", settings.LOOKUP_SERVICE_URL),
            ("REP_SERVER_URL", settings.REP_SERVER_URL),
            ("LOOKUP_REGISTER_KEY", settings.LOOKUP_REGISTER_KEY),
        ) if not val
    ]


def _post_to_lookup(payload: dict) -> None:
    try:
        resp = requests.post(
            f"{settings.LOOKUP_SERVICE_URL.rstrip('/')}/api/lookup/register",
            json=payload,
            headers={"X-Lookup-Key": settings.LOOKUP_REGISTER_KEY},
            timeout=10,
        )
        if resp.status_code == 200:
            logger.info(
                f"Registered with Lookup Service: {payload['rep_type']} "
                f"'{payload['name']}' -> {payload['server_url']}"
            )
        else:
            logger.error(f"Lookup Service registration failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Could not reach Lookup Service: {e}")


def register_representative_with_lookup(rep: dict) -> None:
    """
    Immediately notify the Lookup Service about a representative that was
    JUST created — called right after their account (and tenant DB, in the
    multi-tenant flow) is created, so the citizen app's Lookup Service
    wizard can find them straight away instead of waiting for this server
    to restart.

    `rep` is the dict already assembled by _create_representative_account
    in auth/routes.py — expects at least `name` and `rep_type`, plus
    whichever of assembly_name / parliamentary_name / ward_id applies.
    """
    missing = _missing_lookup_config()
    if missing:
        logger.info(
            f"Skipping Lookup Service registration for new representative "
            f"'{rep.get('name', '')}' — missing: {', '.join(missing)}. "
            "This is expected unless this server is meant to be independently "
            "reachable (see LookupService/README.md)."
        )
        return

    payload = {
        "name":               rep.get("name", ""),
        "rep_type":           (rep.get("rep_type") or "").strip().upper(),
        "server_url":         settings.REP_SERVER_URL,
        "db_url":             settings.MONGODB_URL,
        "assembly_name":      rep.get("assembly_name") or None,
        "parliamentary_name": rep.get("parliamentary_name") or None,
        "ward_id":            rep.get("ward_id") or None,
        "ward_name":          rep.get("ward_name") or None,
        "taluk":              rep.get("taluk") or None,
        "district":           rep.get("district") or None,
        "state":              rep.get("state") or None,
    }
    _post_to_lookup(payload)


def register_with_lookup_service() -> None:
    if settings.DEPLOYMENT_MODE != "SINGLE_TENANT":
        return
    missing = _missing_lookup_config()
    if missing:
        logger.warning(
            f"Skipping Lookup Service self-registration — missing: {', '.join(missing)}. "
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
        "db_url":             settings.MONGODB_URL,
        "assembly_name":      rep.get("assembly_name") or None,
        "parliamentary_name": rep.get("parliamentary_name") or None,
        "ward_id":            rep.get("ward_id") or None,
        "ward_name":          rep.get("ward_name") or None,
        "taluk":              rep.get("taluk") or None,
        "district":           rep.get("district") or None,
        "state":              rep.get("state") or None,
    }
    _post_to_lookup(payload)
