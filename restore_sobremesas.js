
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Manually load env since we are running standalone
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restore() {
    console.log('Restoring Sobremesas...');

    // 1. Get Restaurant
    const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', 'demo')
        .limit(1);

    if (rError || !restaurants.length) {
        console.error('Restaurant not found:', rError);
        return;
    }
    const restaurantId = restaurants[0].id;
    console.log('Restaurant ID:', restaurantId);

    // 2. Check Category
    const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('label', 'Sobremesas');

    let categoryId;

    if (categories && categories.length > 0) {
        console.log('Sobremesas category exists:', categories[0].id);
        categoryId = categories[0].id;
    } else {
        const { data: newCat, error: createError } = await supabase
            .from('categories')
            .insert([{ restaurant_id: restaurantId, label: 'Sobremesas', sort_order: 4 }])
            .select()
            .single();

        if (createError) {
            console.error('Error creating category:', createError);
            return;
        }
        console.log('Created Sobremesas category:', newCat.id);
        categoryId = newCat.id;
    }

    // 3. Add Item
    const { count, error: iError } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

    if (count === 0) {
        const { error: itemInsertError } = await supabase
            .from('menu_items')
            .insert([{
                restaurant_id: restaurantId,
                category_id: categoryId,
                name: 'Petit Gâteau',
                price: '4500',
                desc_text: 'Bolo de chocolate quente com bola de gelado de baunilha.',
                img_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&auto=format&fit=crop',
                available: true,
                is_highlight: true
            }]);

        if (itemInsertError) console.error('Error adding item:', itemInsertError);
        else console.log('Added Petit Gâteau item.');
    } else {
        console.log('Category already has items.');
    }
}

restore();
