-- check_rls.sql
SELECT * FROM pg_policies WHERE tablename = 'tenants';
