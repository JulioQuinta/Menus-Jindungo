import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listSlugs() {
    const { data: restaurants, error } = await supabase.from('restaurants').select('name, slug');
    if (error) {
        fs.writeFileSync('slugs_output_utf8.txt', "Error: " + JSON.stringify(error), 'utf8');
    } else {
        let out = "RESTAURANTS IN DATABASE:\n";
        restaurants.forEach(r => out += `Name: ${r.name} -> Slug: ${r.slug}\n`);
        fs.writeFileSync('slugs_output_utf8.txt', out, 'utf8');
    }
}
listSlugs();
