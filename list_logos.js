
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
    console.log("Listing files in logos bucket...");
    const { data, error } = await supabase
        .storage
        .from('logos')
        .list('');

    if (error) {
        console.error("List Error:", error);
    } else {
        console.log("Files:", data.map(f => f.name));
    }
}

listFiles();
