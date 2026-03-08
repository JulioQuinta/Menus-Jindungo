import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function promoteToAdmin() {
    // 1. Find user by email (we know the email from the dump)
    const email = 'juliopchquinta@gmail.com';

    // Attempting to update the profile directly
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();

    if (error) {
        console.error("Error updating profile:", error);
    } else {
        console.log("Successfully promoted user to admin:", data);
    }
}

promoteToAdmin();
