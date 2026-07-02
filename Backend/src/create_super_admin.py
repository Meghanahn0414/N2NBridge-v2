#!/usr/bin/env python
"""
DEPRECATED — the Super Admin / invite-token gate has been removed.

Admins now self-register directly from the Admin Signup page (no invite
token, no Super Admin approval needed) and pick which representative type
(MLA/MP/Councillor) they'll manage right on that form. There is nothing
left for this script to do — it's kept only so old references to it don't
hard-crash with a missing-file error.
"""


def main():
    print(
        "This script is no longer used. Admin accounts are created directly "
        "from the Admin Signup page — no Super Admin or invite token required."
    )


if __name__ == "__main__":
    main()
