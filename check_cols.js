import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
    const { error } = await supabase.from('menu_items').insert([{
        restaurant_id: '123e4567-e89b-12d3-a456-426614174000', // random uuid
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'test',
        price: '1',
        desc_text: 'test',
        subcategory: 'test',
        available: true,
        img_url: 'test',
        translations: { variants: ['a'] }
    }]);

    console.log("Insert Error:", JSON.stringify(error, null, 2));
}

checkCols();
