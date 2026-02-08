-- Enable pgcrypto extension for password hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the user into auth.users and public.profiles
WITH new_user AS (
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Default instance_id
        gen_random_uuid(), -- Generate a new UUID
        'authenticated',
        'authenticated',
        'sanjog42812@gmail.com',
        crypt('12345678', gen_salt('bf')), -- Hash the password securely
        now(), -- Auto-confirm the email
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id
)
INSERT INTO public.profiles (id, role)
SELECT id, 'user' -- Set role to 'user' (change to 'admin' if needed)
FROM new_user;

-- Verify the insertion
SELECT * FROM auth.users WHERE email = 'sanjog42812@gmail.com';
