import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function listTriggers() {
    // We try to query pg_trigger through a potential execute_sql or similar if we can,
    // but without a direct SQL access it's hard.
    // However, maybe there's an 'execute_sql' RPC already? Let's check.
    
    console.log("Attempting to list triggers on 'orders' table...");
    
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'orders';"
    });
    
    if (error) {
        console.log("RPC 'execute_sql' failed or doesn't exist:", error.message);
        return;
    }
    
    console.log("Triggers on orders:", data);
}

listTriggers();
