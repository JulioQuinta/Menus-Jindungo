import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error reading profiles:", error.message);
    } else {
        const { data: authUsers } = await supabase.auth.admin.listUsers(); // Likely won't work with anon key, but we'll try
        fs.writeFileSync('users.json', JSON.stringify({ profiles }, null, 2), 'utf8');
        console.log("Written to users.json");
    }
}
checkUsers();
