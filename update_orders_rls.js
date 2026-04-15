import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Enabling Public Updates for Orders (for Motoboy App)");
  const { error } = await supabase.rpc('exec_sql', {
       sql_string: `
        -- Allow anonymous users to update orders if they have the ID
        DROP POLICY IF EXISTS "Allow public update order" ON orders;
        CREATE POLICY "Allow public update order" 
        ON orders FOR UPDATE 
        TO anon, authenticated 
        USING (true)
        WITH CHECK (true);
       `
  });

  if (error) {
     console.log("Failed via RPC, the SQL must be executed manually in Supabase Console:", error);
  } else {
     console.log("Success!");
  }
}
run();
