
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id, name, slug, owner_id');

    if (rError) {
        console.error("Database Error:", rError);
        return;
    }

    console.log("Found", restaurants.length, "restaurants:");
    restaurants.forEach(r => {
        console.log(`ID: ${r.id} | Name: ${r.name} | Slug: ${r.slug} | Owner: ${r.owner_id}`);
    });

    const rSlug = restaurants.find(r => r.slug === 'r');
    if (rSlug) {
        console.log("\nWARNING: Found a restaurant with slug 'r'!");
    } else {
        console.log("\nNo restaurant found with slug 'r'.");
    }
}
check();
