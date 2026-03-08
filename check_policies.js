import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const Math = global.Math;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking categories policies...");
    // Since we can't easily query pg_policies with anon key, let's just create a raw query if we have the service key
    const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.log("No service key found for raw queries.");
        return;
    }
    const adminSupabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminSupabase.rpc('get_policies', { table_n: 'categories' });
    console.log("RPC Error:", error);
    console.log("RPC Data:", data);
}
run();
