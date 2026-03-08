import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log("=== Testing Super Admin Dashboard Queries ===");

    // We need to login as super admin first to test RLS policies
    const email = 'julioquinta8@gmail.com';
    // We assume the password is the one created recently or '123456'
    // Actually, we can just use the service role key to see if the query itself is broken

    // Let's just try to query directly first to see if it's a structural error
    try {
        console.log("1. Fetching Profiles...");
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        if (userError) console.error("-> Profiles Error:", userError);
        else console.log("-> Profiles OK:", userData?.length);

        console.log("2. Fetching Restaurants...");
        const { data: restData, error: restError } = await supabase
            .from('restaurants')
            .select('*, profiles:owner_id(email)')
            .order('created_at', { ascending: false })
            .limit(1);
        if (restError) console.error("-> Restaurants Error:", restError);
        else console.log("-> Restaurants OK:", restData?.length);

        console.log("3. Fetching Menu Items Count...");
        const { count: itemsCount, error: itemsError } = await supabase
            .from('menu_items')
            .select('*', { count: 'exact', head: true });
        if (itemsError) console.error("-> Menu Items Error:", itemsError);
        else console.log("-> Menu Items OK. Count:", itemsCount);

    } catch (err) {
        console.log("CATCH BLOCK ERROR:", err);
    }
}

testAuth();
