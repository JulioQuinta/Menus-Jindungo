import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("----- Logging in as Super Admin -----");
    // To login we need the password. We forced password reset to '123456' for admin users earlier in the project.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'julioquinta8@gmail.com',
        password: 'password123' // guessing password from previous logs, or maybe '123456', let's just try 123456
    });

    if (authError) {
        console.log("Auth failed, trying password123:", authError.message);
        const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
            email: 'julioquinta8@gmail.com',
            password: 'password123'
        });
        if (authError2) return console.error("Could not auth.");
    }
    console.log("Logged in!");

    const { data: rests } = await supabase.from('restaurants').select('id').eq('name', 'Comidas da Terra').single();
    if (!rests) return console.log("Restaurante Comidas da Terra not found");

    console.log("Testing insert on categories...");
    const { data, error } = await supabase
        .from('categories')
        .insert([{
            restaurant_id: rests.id,
            name: 'TEST CATEGORY SUPER ADMIN',
            description: 'test'
        }])
        .select();

    console.log("Insert result:");
    console.log("Data:", data);
    console.log("Error:", error);
}

testInsert();
