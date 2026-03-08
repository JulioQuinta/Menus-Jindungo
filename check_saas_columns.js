import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('restaurants').select('plan, valid_until').limit(1);
    if (error) {
        console.error("Columns might not exist. Error:", error.message);
    } else {
        console.log("Columns exist! Data:", data);
    }
}
checkColumns();
