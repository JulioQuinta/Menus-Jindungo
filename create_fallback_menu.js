import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createMenuFallback() {
    const { data: existing } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', 'menu')
        .single();

    if (existing) {
        console.log("Fallback 'menu' restaurant already exists.");
        // Try deleting it so we can re-create fresh one if wanted, or just skip
        return;
    }

    // Need a valid owner ID (we'll use the user's ID)
    const ownerId = '160da23b-d6a7-4841-aff1-de0cfb503410';

    // Create the 'menu' restaurant
    const { data, error } = await supabase
        .from('restaurants')
        .insert([{
            owner_id: ownerId,
            name: 'Menu Jindungos',
            slug: 'menu',
            short_description: 'Menu principal do sistema',
            address: 'Digital',
            theme_config: { primaryColor: '#D4AF37', darkMode: false }
        }])
        .select();

    if (error) {
        console.error("Error creating fallback restaurant:", error);
    } else {
        console.log("Successfully created fallback 'menu' restaurant:", data);
    }
}

createMenuFallback();
