import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listSlugs() {
    const { data: restaurants, error } = await supabase.from('restaurants').select('name, slug');
    if (error) {
        console.error("Error fetching rules:", error);
    } else {
        console.log("RESTAURANTS IN DATABASE:");
        restaurants.forEach(r => console.log(`Name: ${r.name} -> Slug: ${r.slug}`));
    }
}
listSlugs();
