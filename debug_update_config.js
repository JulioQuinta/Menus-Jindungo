
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUpdate() {
    console.log("Debugging Update...");

    // 1. Get current config
    const { data: current, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
        .single();

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    console.log("Current ID:", current.id);
    console.log("Current Config:", current.theme_config);

    // 2. Try to update logoUrl
    const newConfig = {
        ...current.theme_config,
        logoUrl: "https://example.com/test-logo.png",
        updatedAt: new Date().toISOString()
    };

    const { data: updateData, error: updateError } = await supabase
        .from('restaurants')
        .update({ theme_config: newConfig })
        .eq('id', current.id)
        .select();

    if (updateError) {
        console.error("Update Error:", JSON.stringify(updateError, null, 2));
    } else {
        console.log("Update Success! New Data:", JSON.stringify(updateData, null, 2));
    }
}

debugUpdate();
