-- N2Bridge — row-level security policies
-- Apply after creating tables. Enables tenant isolation: every query only sees
-- rows whose tenant_id matches the session's app.current_tenant (set per request
-- in app/common/db.py -> tenant_session).

-- Repeat this block for each tenant-scoped table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'citizens', 'cases', 'case_events', 'devices',
    'roles', 'categories', 'accounts', 'subscriptions', 'otp_codes'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
      USING (tenant_id = current_setting('app.current_tenant')::uuid)
      WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);
    $f$, t);
  END LOOP;
END $$;

-- Note: the app connects as a NON-superuser role (n2bridge_app). Superusers and
-- table owners bypass RLS unless FORCE ROW LEVEL SECURITY is set (done above).
