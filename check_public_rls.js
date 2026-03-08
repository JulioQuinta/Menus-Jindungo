import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("Checking if we can read the restaurant as public...");
    const { data, error } = await supabase.from('restaurants').select('id, name, slug, status').eq('slug', 'restaurante-dikuzimba');

    if (error) {
        console.error("Public Error:", error);
    } else {
        console.log("Data returned to Public:", data);
        if (data.length === 0) {
            console.log("WARNING: 0 rows returned. RLS is likely blocking public read.");
        }
    }
}
checkRLS();
