
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking Sobremesas...');

    // 1. Get Restaurant
    const { data: restaurants } = await supabase.from('restaurants').select('id').eq('slug', 'demo').limit(1);
    if (!restaurants?.length) { console.log('No demo restaurant'); return; }

    const restaurantId = restaurants[0].id;

    // 2. Check Category
    const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId);

    if (error) { console.error('Error fetching categories:', error); return; }

    console.log('Categories found:', categories.length);
    categories.forEach(c => console.log(`- ${c.label} (ID: ${c.id})`));

    const sobremesas = categories.find(c => c.label === 'Sobremesas');
    if (sobremesas) {
        console.log('✅ Sobremesas EXISTS!');
        // Check items
        const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('category_id', sobremesas.id);
        console.log(`- Items in Sobremesas: ${count}`);
    } else {
        console.log('❌ Sobremesas MISSING');
    }
}

check();
