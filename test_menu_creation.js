import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMenuCreation() {
    console.log("Testing Category and Dish Creation...");

    // 1. Get user profile
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'juliopchquinta@gmail.com');

    if (!profiles || profiles.length === 0) {
        console.error("Admin user not found.");
        return;
    }
    const adminId = profiles[0].id;

    // 2. Get restaurant
    const { data: rests } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', adminId);

    if (!rests || rests.length === 0) {
        console.error("Restaurant not found.");
        return;
    }
    const restaurantId = rests[0].id;
    console.log("Found Restaurant ID:", restaurantId);

    // 3. Create a Category
    console.log("Creating Test Category...");
    const { data: categoryData, error: catError } = await supabase
        .from('categories')
        .insert([{
            restaurant_id: restaurantId,
            label: 'Sobremesas Frias (Teste)',
            sort_order: 99,
            subcategories: ['Gelados', 'Bolos']
        }])
        .select();

    if (catError) {
        console.error("Failed to create category:", catError.message);
        return;
    }

    const newCategoryId = categoryData[0].id;
    console.log("✅ Category Created:", newCategoryId);

    // 4. Create a Dish
    console.log("Creating Test Dish...");
    const { data: dishData, error: dishError } = await supabase
        .from('menu_items')
        .insert([{
            restaurant_id: restaurantId,
            category_id: newCategoryId,
            name: 'Gelado de Morango',
            price: '2.500 Kz',
            desc_text: 'Delicioso gelado de morango com calda de chocolate.',
            subcategory: 'Gelados',
            available: true,
            position: 1
        }])
        .select();

    if (dishError) {
        console.error("Failed to create dish:", dishError.message);
        return;
    }

    console.log("✅ Dish Created:", dishData[0].name);

    // 5. Clean up (Optional, but good practice so we don't litter their menu)
    console.log("Cleaning up test data...");
    await supabase.from('menu_items').delete().eq('id', dishData[0].id);
    await supabase.from('categories').delete().eq('id', newCategoryId);
    console.log("✅ Cleaned up.");
}

testMenuCreation();
