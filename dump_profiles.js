import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) console.error("Error:", error);
    fs.writeFileSync('profiles_dump.json', JSON.stringify(data, null, 2));
    console.log('Dumped to profiles_dump.json');
}

check();
