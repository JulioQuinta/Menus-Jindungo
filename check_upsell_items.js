import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const slug = 'novo-restaurante-comidas-da-terra';
    console.log('--- Checking Restaurant Plan ---');
    const { data: res, error: rErr } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

    if (rErr) {
        console.error('Error fetching restaurant:', rErr);
        return;
    }
    console.log('Name:', res.name);
    console.log('Plan:', res.plan);
    console.log('ID:', res.id);

    console.log('\n--- Checking Menu Items ---');
    const { data: items, error: iErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', res.id);

    if (iErr) {
        console.error('Error fetching items:', iErr);
        return;
    }

    console.log('Total items in DB:', items.length);
    items.forEach(i => {
        console.log(`- [${i.is_available ? 'AVAILABLE' : 'SOLD OUT'}] ${i.name} (Price: ${i.price})`);
    });

    const available = items.filter(i => i.is_available);
    console.log('\nTotal AVAILABLE items:', available.length);
}

check();
