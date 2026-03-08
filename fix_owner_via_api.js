
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from current directory (where script is run)
// Since we are running with 'node', we need to manually config dotenv if it's not in standard path, 
// but usually it is in root.
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOwner() {
    const ownerId = '160da23b-d6a7-4841-aff1-de0cfb503410';

    console.log("Updating 'demo' restaurant owner to:", ownerId);

    // 1. Check if restaurant exists
    const { data: current, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', 'demo')
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching demo restaurant:", fetchError);
        // Don't exit, might be RLS blocking read.
    } else {
        console.log("Current demo restaurant:", current || "Not found (or RLS hidden)");
    }

    // 2. Update
    // Note: If RLS is enabled and active, this might fail with ANON key if policies don't allow.
    // But we tried to DISABLE RLS. If that worked, this will work.
    // If that failed, we need a service role key. 
    // Do we have a service role key? Usually not in .env for client.
    // BUT, the user said they are the admin. Ideally they should be able to update if they own it... wait.
    // If they DON'T own it yet, they can't update it via RLS policy "Users can update their own restaurant".
    // This is the Catch-22.
    // CLUE: The user is 'Administrator'.

    // Attempt Update
    const { data, error } = await supabase
        .from('restaurants')
        .update({ owner_id: ownerId })
        .eq('slug', 'demo')
        .select();

    if (error) {
        console.error("Update failed:", error);
    } else {
        console.log("Update success!", data);
    }
}

fixOwner();
