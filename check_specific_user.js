import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkUser() {
  const { data, error } = await supabase.from('profiles').select('email, role, is_super_admin').ilike('email', '%julio.quint8%');
  console.log("Check user:", data, error);
}

checkUser();
