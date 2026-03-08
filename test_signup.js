import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    const testEmail = `test_${Date.now()}@example.com`;
    console.log("Attempting to sign up:", testEmail);
    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123'
    });

    if (error) {
        console.error("SignUp Error:", error);
    } else {
        console.log("SignUp Success, checking profile...");
        // Wait a second for trigger
        await new Promise(r => setTimeout(r, 1000));
        const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (pError) console.error("Profile Fetch Error:", pError);
        else console.log("Profile created successfully:", profile);
    }
}

testAuth();
