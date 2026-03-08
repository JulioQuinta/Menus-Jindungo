
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching restaurants:", error);
    } else if (restaurants && restaurants.length > 0) {
        console.log("Restaurant COLUMNS_START");
        console.log(JSON.stringify(Object.keys(restaurants[0])));
        console.log("Restaurant COLUMNS_END");
    } else {
        console.log("No restaurants found to inspect schema.");
    }
}

checkSchema();
