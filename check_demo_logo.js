import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDemoLogo() {
    console.log("Checking Demo Restaurant Logo...");
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, theme_config')
        .eq('slug', 'demo')
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        const logoUrl = data?.theme_config?.logoUrl;
        console.log("Restaurant:", data.name);
        console.log("Slug:", data.slug);
        console.log("Has Theme Config:", !!data.theme_config);
        if (logoUrl) {
            console.log("Logo URL length:", logoUrl.length);
            console.log("Logo URL starts with:", logoUrl.substring(0, 50));
        } else {
            console.log("Logo URL is Empty or Undefined.");
        }
    }
}

checkDemoLogo();
