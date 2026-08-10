import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkOrdersColumns() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("COLUMNS OF ORDERS TABLE:", Object.keys(data[0]));
    console.log("SAMPLE ROW:", data[0]);
  } else {
    console.log("No orders found or error:", error);
  }
}

checkOrdersColumns();
