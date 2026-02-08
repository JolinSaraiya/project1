-- 1. First, run this line to see your registered email and ID:
SELECT id, email FROM auth.users;

-- 2. Copy the 'id' from the result above.

-- 3. Replace 'YOUR_USER_ID_HERE' below with the ID you copied:
INSERT INTO public.profiles (id, role)
VALUES (
  'YOUR_USER_ID_HERE',  -- Paste UUID here, e.g. 'a0eebc99-9c0b...'
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Alternatively, if you are SURE about the email, replace 'my@email.com' below:
-- INSERT INTO public.profiles (id, role)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'my@email.com'), -- CHANGE THIS EMAIL
--   'admin'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
