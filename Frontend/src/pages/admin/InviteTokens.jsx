// REMOVED — the Super Admin / invite-token gate has been taken out of the
// app. Admins now self-register directly from the Admin Signup page and
// pick their own scope (MLA/MP/Councillor) there — no token to generate or
// track. This file is no longer imported or routed anywhere; it's kept only
// so nothing breaks if something still resolves this path. Safe to delete.
export default function InviteTokens() {
  return null;
}
