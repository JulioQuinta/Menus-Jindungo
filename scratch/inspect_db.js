import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
  console.log("=== INSPECTING DB ===");
  
  // 1. Get all profiles
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, email, role, is_super_admin, status');
  console.log("PROFILES:", profiles, pError);
  
  // 2. Get all restaurants
  const { data: restaurants, error: rError } = await supabase.from('restaurants').select('id, name, owner_id, slug, plan');
  console.log("RESTAURANTS:", restaurants, rError);
}

inspect();
