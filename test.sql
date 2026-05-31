DO $$ 
DECLARE
    tbl text := 'Service';
BEGIN
    EXECUTE format('
        CREATE POLICY "tenant_isolation_policy" ON %I
        FOR ALL
        USING (
            "shopId" = current_setting(''app.current_shop_id'', true)
            OR current_setting(''app.bypass_rls'', true) = ''true''
        );
    ', tbl);
END $$;
