import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fix() {
    const slug = 'novo-restaurante-comidas-da-terra';
    const { data: res } = await supabase.from('restaurants').select('id').eq('slug', slug).single();

    if (res) {
        console.log('Fixed restaurant ID:', res.id);
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: true })
            .eq('restaurant_id', res.id);

        if (error) console.error('Error:', error);
        else console.log('Items activated successfully!');
    }
}

fix();
