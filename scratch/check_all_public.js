
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPolicies() {
    // We can't query pg_policies directly via anon key usually.
    // But we can try to see if a public read works for ALL.
    console.log("Fetching all restaurants...");
    const { data, error } = await supabase.from('restaurants').select('id, name');
    if (error) {
        console.error("Error fetching restaurants:", error);
    } else {
        console.log("Count:", data.length);
        console.log("Data:", data);
    }
}
checkPolicies();
