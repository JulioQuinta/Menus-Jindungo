import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkAdmins() {
  const { data, error } = await supabase.from('profiles').select('email, role, is_super_admin').eq('role', 'super_admin');
  console.log("Super Admins:", data, error);
}

checkAdmins();
