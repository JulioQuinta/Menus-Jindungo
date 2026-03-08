import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('restaurants').select('theme_config').eq('slug', 'demo').single();
    if (data && data.theme_config && data.theme_config.logoUrl) {
        console.log("\n--- FULL LOGO URL ---");
        console.log(data.theme_config.logoUrl);
        console.log("---------------------\n");
    } else {
        console.log("No logo found");
    }
}
check();
