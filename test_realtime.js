import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealtime() {
    console.log("Testing realtime subscription...");
    const channel = supabase.channel('test-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes_garcom' }, (payload) => {
            console.log("REALTIME RECEIVED:", payload);
        })
        .subscribe((status, err) => {
            console.log("Subscribe status:", status, err || '');
        });
    
    // wait 3 seconds, then insert a dummy notification
    setTimeout(async () => {
        console.log("Inserting dummy notification...");
        const { data, error } = await supabase.from('notificacoes_garcom').insert([{
            mesa_id: 'TEST_REALTIME',
            restaurant_id: 'def7479a-6c90-45e4-9d69-cae1aace983b'
        }]).select();
        console.log("Insert result:", error || data);
    }, 3000);

    // exit after 8 seconds
    setTimeout(() => {
        console.log("Test finished.");
        process.exit(0);
    }, 8000);
}

checkRealtime();
