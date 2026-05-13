import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching menu_items:', error);
        return;
    }

    if (data.length > 0) {
        console.log('Columns in menu_items:', Object.keys(data[0]));
    } else {
        console.log('No data in menu_items to check columns.');
    }
}

checkColumns();
