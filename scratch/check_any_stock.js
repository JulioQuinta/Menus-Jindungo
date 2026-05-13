import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAnyStock() {
    const { data, error } = await supabase.from('menu_items').select('name, stock_quantity, track_stock').gt('stock_quantity', 0);
    if (error) return console.error(error);
    console.log("Items with stock:", data);
}

checkAnyStock();
