import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    console.log("Attempting to insert into profiles");
    const { error } = await supabase.from('profiles').insert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'test@test.com',
        role: 'admin',
        status: 'pending'
    });
    console.log("Error inserting into profiles:", error);
}

checkProfile();
