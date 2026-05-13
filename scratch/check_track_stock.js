import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTrackStock() {
    const { data, error } = await supabase.from('menu_items').select('name, track_stock').eq('track_stock', true);
    if (error) return console.error(error);
    console.log("Items with track_stock = true:", data);
}

checkTrackStock();
