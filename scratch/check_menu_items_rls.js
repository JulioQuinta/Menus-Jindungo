import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkMenuItemsPolicies() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { target_table: 'menu_items' });
  console.log("POLICIES FOR menu_items:", data, error);
}

checkMenuItemsPolicies();
