import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://douhreyatrwicofxjvql.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdWhyZXlhdHJ3aWNvZnhqdnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDg4NTMsImV4cCI6MjA4NTg4NDg1M30.aOHaMLkwgyltLiewSFL-DsxUwaJWUbXhwkeTca5Yklc';

const supabase = createClient(supabaseUrl, supabaseKey);

const createUser = async () => {
    const email = 'sanjog42812@gmail.com';
    const password = '12345678';

    console.log(`Attempting to create user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created successfully:', data.user);

        // Also ensure profile exists (in case trigger failed or hasn't run yet)
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: data.user.id, role: 'user' }])
                .select();

            if (profileError) {
                // Ignore duplicate key error if profile already exists due to trigger
                if (profileError.code === '23505') {
                    console.log('Profile already exists (Trigger likely worked).');
                } else {
                    console.error('Error creating profile manually:', profileError.message);
                }
            } else {
                console.log('Profile created manually.');
            }
        }
    }
};

createUser();
