
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CORRECT_logoUrl = "https://dntbzdlliymbworzqowb.supabase.co/storage/v1/object/public/logos/c5b635a1-7c8f-4202-82be-a5fb25ccd6c3-1771207250559.jpg";

async function forceUpdate() {
    console.log("Forcing logo update...");

    // 1. Get ALL restaurants
    const { data: restaurants, error: fetchError } = await supabase
        .from('restaurants')
        .select('id, theme_config');

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    console.log(`Found ${restaurants.length} restaurants.`);

    // 2. Update each
    for (const r of restaurants) {
        console.log(`Updating restaurant ${r.id}...`);

        const newConfig = {
            ...(r.theme_config || {}),
            logoUrl: CORRECT_logoUrl,
            lastUpdatedHack: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from('restaurants')
            .update({ theme_config: newConfig })
            .eq('id', r.id);

        if (updateError) {
            console.error(`  > Failed to update ${r.id}:`, updateError);
        } else {
            console.log(`  > Success!`);
        }
    }
}

forceUpdate();
