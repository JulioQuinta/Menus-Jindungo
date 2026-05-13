require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('get_triggers');
  if (error) {
    console.error("RPC failed, falling back to REST query if possible or ignoring:", error);
    // Let's just create a SQL query via REST if we have pg_meta or something... but we can't do direct SQL without postgres connection string.
  } else {
    console.log(data);
  }
}
checkTriggers();
