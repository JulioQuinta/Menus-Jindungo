import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkTriggers() {
  console.log("=== CHECKING TRIGGERS ON menu_items ===");
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.menu_items'::regclass;"
  });
  console.log("Triggers list:", data, error);
}

checkTriggers();
