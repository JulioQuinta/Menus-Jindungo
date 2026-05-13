import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log("Checking if system_notifications exists...");
    const { data, error } = await supabase.from('system_notifications').select('*').limit(1);
    if (error) {
        console.error("Error querying table:", error);
    } else {
        console.log("Table exists! Data:", data);
    }
}

checkTable();
