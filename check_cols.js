import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCols() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'menu_items' });
    if (error) {
        // Fallback: select one row
        const { data: row, error: rError } = await supabase.from('menu_items').select('*').limit(1);
        if (rError) console.error(rError);
        else console.log(Object.keys(row[0] || {}));
    } else {
        console.log(data);
    }
}
checkCols();
