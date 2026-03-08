
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking ORDERS table...");
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching orders:", error);
    } else if (orders && orders.length > 0) {
        console.log("Orders COLUMNS:", Object.keys(orders[0]));
        console.log("Sample:", orders[0]);
    } else {
        console.log("Orders table empty or valid. Attempting insert to check constraints if needed.");
        // Try a dummy insert that will fail but show columns? No, better to just trust if no error on select.
        console.log("No orders found, but table exists (no error).");
    }

    console.log("\nChecking NOTIFICACOES_GARCOM table...");
    const { data: notifs, error: nErr } = await supabase
        .from('notificacoes_garcom')
        .select('*')
        .limit(1);

    if (nErr) console.error("Error fetching notifs:", nErr);
    else if (notifs && notifs.length > 0) console.log("Notifs COLUMNS:", Object.keys(notifs[0]));
    else console.log("Notifs table empty or valid.");
}

checkSchema();
