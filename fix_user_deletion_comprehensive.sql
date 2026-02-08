-- COMPREHENSIVE FIX FOR USER DELETION ERROR
-- This script applies "ON DELETE CASCADE" to all tables that reference auth.users.

-- 1. Fix 'public.profiles' (Standard)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix 'public.societies' (Standard)
ALTER TABLE public.societies
DROP CONSTRAINT IF EXISTS societies_user_id_fkey;

ALTER TABLE public.societies
ADD CONSTRAINT societies_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Fix 'public.compost_logs' (Likely hidden culprit)
-- We wrap this in a DO block to avoid errors if the constraint has a weird name
DO $$
BEGIN
    -- Check if column exists first
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compost_logs' AND column_name = 'user_id') THEN
        
        -- Try to drop standard constraint name
        BEGIN
            ALTER TABLE public.compost_logs DROP CONSTRAINT IF EXISTS compost_logs_user_id_fkey;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignore if it doesn't exist
        END;

        -- Re-add with CASCADE
        ALTER TABLE public.compost_logs
        ADD CONSTRAINT compost_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
    END IF;
END $$;

-- 4. DIAGNOSTIC: Run this to see if anything else is left
SELECT
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users' AND ccu.table_schema = 'auth';
