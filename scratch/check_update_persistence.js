import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkUpdate() {
    const { data: items } = await supabase.from('menu_items').select('*').limit(1);
    const item = items[0];
    
    console.log(`Initial stock: ${item.stock_quantity}`);
    
    console.log(`Updating stock of ${item.name} to 777...`);
    const { data, error } = await supabase
        .from('menu_items')
        .update({ stock_quantity: 777, track_stock: true })
        .eq('id', item.id)
        .select();
    
    if (error) {
        console.error("Update error:", error);
    } else {
        console.log("Update response data:", data);
    }
    
    const { data: updated } = await supabase.from('menu_items').select('stock_quantity').eq('id', item.id);
    console.log(`Stock after update: ${updated[0].stock_quantity}`);
}

checkUpdate();
