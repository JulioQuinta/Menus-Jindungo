import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// We need the SERVICE ROLE KEY to bypass RLS and read auth.users, but we can try to use anon key to login and see the exact error
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = 'quintajulio8@hotmail.com';
    // Let's try to see if we can get a specific error message
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'password_just_to_check_error' // Intentionally wrong to see if it says email not confirmed
    });

    if (error) {
        console.log("Login Error for", email, ":", error.message, error.status);
    } else {
        console.log("Login Success!");
    }
}
testLogin();
