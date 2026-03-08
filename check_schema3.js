import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const Math = global.Math;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('categories').select('*').limit(1);
    console.log("Error:", error);
    if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log("KEYS ARE:");
        keys.forEach(k => console.log("- " + k));
    }
}
run();
