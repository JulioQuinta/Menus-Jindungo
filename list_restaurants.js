
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listRestaurants() {
    console.log("Listing restaurants...");
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, owner_id');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Restaurants:", JSON.stringify(data, null, 2));
    }
}

listRestaurants();
