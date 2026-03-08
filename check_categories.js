import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: rests } = await supabase.from('restaurants').select('id, name');
    console.log("Restaurants:", rests);

    const { data: cats } = await supabase.from('categories').select('id, name, restaurant_id');

    // Group by restaurant_id
    const grouped = {};
    if (cats) {
        cats.forEach(c => {
            grouped[c.restaurant_id] = (grouped[c.restaurant_id] || 0) + 1;
        });
    }
    console.log("Categories per restaurant:", grouped);
}
check();
