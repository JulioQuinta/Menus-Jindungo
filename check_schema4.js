import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const Math = global.Math;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking menu_items table...");
    const { data, error } = await supabase.from('menu_items').select('*').limit(1);
    console.log("Error:", error);
    if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log("KEYS ARE:");
        keys.forEach(k => console.log("- " + k));
    } else {
        console.log("No menu items found. Inserting dummy...");
        const { error: insErr } = await supabase.from('menu_items').insert([{}]).select();
        console.log(insErr);
    }
}
run();
