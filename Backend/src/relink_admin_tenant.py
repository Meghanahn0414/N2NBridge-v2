#!/usr/bin/env python
"""
Relink a scoped Admin to a different (existing) representative's tenant.

One-off fixup script — not exposed through any API endpoint, by design
(same reasoning as create_super_admin.py: this changes which tenant an
admin manages, so it should only ever be run directly on the server).

Use case: two admin accounts ended up registering separate representatives
for what should have been the same MLA/MP/Councillor (e.g. one admin's
representative registration failed silently earlier and they registered
again under a second admin login, creating a second, disconnected tenant).
This points the "wrong" admin's managedDbName at the "correct", already-
populated tenant instead, so it starts seeing that tenant's real data
(citizens, grievances, staff) going forward.

This does NOT delete or merge any data — the old tenant this admin used to
manage (if any) is left untouched, just unlinked from this admin account.

Usage:
    cd Backend
    python src/relink_admin_tenant.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.database import MongoDatabase
from config.settings import settings


def _prompt(label: str) -> str:
    while True:
        value = input(f"{label}: ").strip()
        if value:
            return value
        print("  This field is required.")


def main():
    print("=" * 60)
    print("Relink Admin to a Different Tenant")
    print("=" * 60)

    MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_MASTER_DB)
    master = MongoDatabase.get_db()

    source_email = _prompt("Email of the account ALREADY correctly linked to the target tenant").lower()

    # This account might be a scoped Admin (master.users, role=ADMIN,
    # managedDbName points at their tenant) OR a directly-registered
    # Representative (their own account lives inside their tenant's own
    # `users` collection, not master.users at all — the elevation flow that
    # used to convert an Admin into this shape was removed later, but
    # accounts created while it still existed, or registered directly via
    # the representative registration flow, are this shape). Either way,
    # master.user_registry is the one place EVERY account's email resolves
    # to its db_name, regardless of which shape it is — use that as the
    # single source of truth instead of guessing which collection to check.
    registry_entry = master.user_registry.find_one({"email": source_email})
    if not registry_entry or not registry_entry.get("db_name"):
        print(f"\nNo account found with email {source_email} (checked master.user_registry). Aborting.")
        return

    target_db_name = registry_entry["db_name"]
    if target_db_name == settings.MONGODB_MASTER_DB:
        print(f"\n{source_email} resolves to the master database itself, not a representative tenant "
              f"(this usually means they're a plain Admin who hasn't registered their representative yet, "
              f"or a Field Officer/Manager account). Aborting — there's no tenant here to link to.")
        return

    print(f"\n{source_email} resolves to tenant: {target_db_name}")

    dest_email = _prompt("\nEmail of the admin to RELINK to that same tenant").lower()
    if dest_email == source_email:
        print("\nThat's the same account — nothing to do.")
        return

    dest_doc = master.users.find_one({"email": dest_email, "role": "ADMIN"})
    if not dest_doc:
        print(f"\nNo ADMIN account found with email {dest_email}. Aborting.")
        return

    old_db_name = dest_doc.get("managedDbName")
    print(f"\n{dest_email} currently manages: {old_db_name or '(nothing yet)'}")
    print(f"About to relink {dest_email} -> {target_db_name}")
    confirm = input("Type 'yes' to confirm: ").strip().lower()
    if confirm != "yes":
        print("Cancelled.")
        return

    master.users.update_one(
        {"_id": dest_doc["_id"]},
        {"$set": {"managedDbName": target_db_name}},
    )

    print("\n" + "=" * 60)
    print(f"Done. {dest_email} now manages tenant: {target_db_name}")
    if old_db_name and old_db_name != target_db_name:
        print(f"(Their previous tenant, {old_db_name}, still exists untouched — just unlinked from this admin.)")
    print("Log out and back in as this admin (or refresh the session) to pick up the change.")
    print("=" * 60)


if __name__ == "__main__":
    main()
