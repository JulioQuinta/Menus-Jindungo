import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRest() {
    console.log("Attempting to insert into restaurants (it will fail RLS, but we can check constraint errors)");
    const { error } = await supabase.from('restaurants').insert({
        name: 'test',
        slug: 'test-slug',
        owner_id: '00000000-0000-0000-0000-000000000000',
        plan: 'start',
        status: 'suspended'
    });
    console.log("Error inserting into restaurants:", error);
}

checkRest();
