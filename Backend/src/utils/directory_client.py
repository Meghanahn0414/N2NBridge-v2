"""
DEPRECATED — replaced by utils/lookup_client.py as part of the
DirectoryService -> LookupService rename.

This file is kept only so nothing breaks if something still imports it,
but nothing in this codebase should reference it anymore. Safe to delete
once you've confirmed no other references remain (see main.py, which now
imports from utils.lookup_client instead).
"""
from utils.lookup_client import register_with_lookup_service as register_with_directory  # noqa: F401
