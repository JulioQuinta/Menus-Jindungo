
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('restaurants').select('name, slug');
    console.log("--- ALL RESTAURANTS ---");
    data.forEach(r => console.log(`NAME: [${r.name}] -> SLUG: [${r.slug}]`));
    console.log("------------------------");
}
check();
