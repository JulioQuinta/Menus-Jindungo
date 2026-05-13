import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStability() {
    const { data: items } = await supabase.from('menu_items').select('*').limit(1);
    const item = items[0];
    
    console.log(`Setting stock of ${item.name} to 10...`);
    await supabase.from('menu_items').update({ stock_quantity: 10, track_stock: true }).eq('id', item.id);
    
    console.log("Waiting 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
    
    const { data: updated } = await supabase.from('menu_items').select('stock_quantity').eq('id', item.id);
    console.log(`Stock after 5 seconds: ${updated[0].stock_quantity}`);
}

checkStability();
