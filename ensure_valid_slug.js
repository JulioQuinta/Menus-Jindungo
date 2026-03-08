import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRestaurant() {
    console.log("Looking for user's restaurant to ensure it has a valid slug...");

    // 1. Get user 'juliopchquinta@gmail.com'
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', 'juliopchquinta@gmail.com');

    if (!profiles || profiles.length === 0) {
        console.log("Admin profile not found!");
        return;
    }
    const adminId = profiles[0].id;

    // 2. Check if restaurant exists for this admin
    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', adminId);

    if (!restaurants || restaurants.length === 0) {
        console.log("Admin has no restaurant! Attempting to create one...");
        // This shouldn't be the case since they tested 'menus', etc, but just in case
        const { data: newRest, error: createError } = await supabase
            .from('restaurants')
            .insert([{
                owner_id: adminId,
                name: 'Restaurante Teste',
                slug: 'restaurante-teste',
                address: '',
                theme_config: { primaryColor: '#D4AF37', darkMode: false }
            }])
            .select();

        if (createError) {
            console.error("Failed to create restaurant:", createError);
        } else {
            console.log("✅ Created a new restaurant for the admin:", newRest[0].slug);
        }
    } else {
        const rest = restaurants[0];
        console.log("Admin has a restaurant:", rest.name, "with slug:", rest.slug);

        // Let's forcefully change the slug to something standard for testing
        // to make sure it's valid
        console.log("Forcing a safe slug to ensure access...");
        const newSlug = 'meu-restaurante';
        const { error: updateError } = await supabase
            .from('restaurants')
            .update({ slug: newSlug })
            .eq('id', rest.id);

        if (updateError) {
            console.error("Failed to update slug:", updateError);
        } else {
            console.log("✅ Successfully updated the restaurant slug to:", newSlug);
            console.log("URL should be: http://localhost:5176/" + newSlug);
        }
    }
}

fixRestaurant();
