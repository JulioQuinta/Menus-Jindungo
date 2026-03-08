import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function setSuperAdmin() {
    const { data, error } = await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', '160da23b-d6a7-47b7-ab9a-2bf2aece5f7c');
    console.log("Updated roles:", error);
}

setSuperAdmin();
