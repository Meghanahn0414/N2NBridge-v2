// REMOVED — the Super Admin role has been taken out of the app. Admins now
// self-register directly from the Admin Signup page (no bootstrap step, no
// approval gate). This file was already unrouted/unused before the removal;
// it's kept only so nothing breaks if something still resolves this path.
// Safe to delete.
export default function SuperAdminSetup() {
  return null;
}
