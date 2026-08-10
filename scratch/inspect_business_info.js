import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('name, business_info, delivery_config')
        .limit(1);

    if (error) {
        console.error(error);
    } else {
        console.log("RESTAURANT INFO:", JSON.stringify(restaurants, null, 2));
    }
}
inspect();
