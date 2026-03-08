
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
    console.log("Checking restaurant config...");
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, theme_config')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Restaurant Data:", JSON.stringify(data, null, 2));
    }
}

checkConfig();
