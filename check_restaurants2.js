import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRest() {
    console.log("Fetching all restaurants to inspect slugs and statuses...");
    const { data: allRestaurants, error: allRError } = await supabase
        .from('restaurants')
        .select('id, name, slug, status, owner_id');

    if (allRError) {
        console.error("Error fetching all restaurants:", allRError);
    } else {
        console.table(allRestaurants.map(r => ({ name: r.name, slug: r.slug, status: r.status, id: r.id })));
    }
}

checkRest();
