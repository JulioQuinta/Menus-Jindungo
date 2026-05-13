import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { target_table: 'profiles' });
  if (error) {
    console.error("RPC failed, fetching directly via pg_meta or standard ways might be blocked.", error);
  } else {
    console.log(data);
  }
}

checkPolicies();
