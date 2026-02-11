-- DIAGNOSIS SCRIPT
-- Run this in Supabase SQL Editor to see what Triggers are active

SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    action_timing,
    event_manipulation as event,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- check for the specific function
SELECT routines.routine_name, routines.routine_definition
FROM information_schema.routines
WHERE routines.routine_schema = 'public' 
AND routines.routine_name = 'handle_new_user';
