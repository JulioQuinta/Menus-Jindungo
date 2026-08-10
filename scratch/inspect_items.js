import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function inspectItems() {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, track_stock, stock_quantity, restaurant_id')
    .eq('restaurant_id', 'def7479a-6c90-45e4-9d69-cae1aace983b');
    
  console.log("ITEMS FOR COMIDAS DA TERRA:", items, error);
}

inspectItems();
