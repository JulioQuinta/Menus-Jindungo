import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking 'coupons' table structure...");
    const { data, error } = await supabase.from('coupons').select('*').limit(1);
    
    if (error) {
        console.error("Error fetching coupons:", error.message);
        // Try to get columns via a failing insert if empty
        const { error: insertError } = await supabase.from('coupons').insert([{}]).select();
        console.log("Insert Error (might show missing columns):", insertError?.message);
    } else if (data && data.length > 0) {
        console.log("Coupons columns found:", Object.keys(data[0]));
    } else {
        console.log("Table is empty. Attempting to fetch column names via RPC or similar is restricted, so we'll try a dummy insert.");
        const { error: insertError } = await supabase.from('coupons').insert({ code: 'TEST_PROBE' }).select();
        if (insertError) {
            console.log("Probe Insert Error:", insertError.message);
        } else {
            const { data: newData } = await supabase.from('coupons').select('*').eq('code', 'TEST_PROBE');
            if (newData && newData.length > 0) {
                console.log("Coupons columns discovered:", Object.keys(newData[0]));
                // Cleanup
                await supabase.from('coupons').delete().eq('code', 'TEST_PROBE');
            }
        }
    }
}

check();
