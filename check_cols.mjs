import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const p = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles:", Object.keys(p.data?.[0] || {}));
  
  const r = await supabase.from('restaurants').select('*').limit(1);
  console.log("Restaurants:", Object.keys(r.data?.[0] || {}));
}
check();
