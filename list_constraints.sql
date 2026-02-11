-- DIAGNOSIS: LIST ALL BLOCKING CONSTRAINTS
-- Run this in Supabase SQL Editor

SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
WHERE confrelid = 'auth.users'::regclass;
