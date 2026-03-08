import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRestaurants() {
    console.log("Fetching all restaurants attached to user 'juliopchquinta@gmail.com' (using owner ID if known, or just fetching all for now to inspect slugs)...");

    // Fetch user profile to get ID
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('email', 'juliopchquinta@gmail.com');

    if (pError) {
        console.error("Error fetching admin profile:", pError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log("Profile not found.");
        return;
    }

    const adminProfile = profiles[0];
    console.log("Admin ID:", adminProfile.id, "Role:", adminProfile.role);

    // Fetch restaurants
    const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id, name, slug, status, owner_id')
        .eq('owner_id', adminProfile.id);

    if (rError) {
        console.error("Error fetching restaurants:", rError);
    } else {
        console.log("Restaurants for this user:");
        console.table(restaurants);
    }

    // Let's also fetch ALL restaurants just in case it belongs to someone else
    console.log("\n--- ALL RESTAURANTS ---");
    const { data: allRestaurants, error: allRError } = await supabase
        .from('restaurants')
        .select('id, name, slug, status, owner_id');

    if (allRError) {
        console.error("Error fetching all restaurants:", allRError);
    } else {
        console.table(allRestaurants.map(r => ({ name: r.name, slug: r.slug, status: r.status })));
    }
}

checkRestaurants();
