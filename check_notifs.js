import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifs() {
    console.log("Fetching all pending waiter notifications...");
    const { data, error } = await supabase
        .from('notificacoes_garcom')
        .select('*')
        .eq('status', 'pendente');
    
    if (error) console.error("Error:", error);
    else console.log("Pending Notifications:", data);
}

testNotifs();
