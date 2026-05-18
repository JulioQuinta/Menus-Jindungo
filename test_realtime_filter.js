import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealtimeFilter() {
    const restaurantId = 'def7479a-6c90-45e4-9d69-cae1aace983b';
    console.log("Testing realtime subscription with filter:", `restaurant_id=eq.${restaurantId}`);
    
    const channel = supabase.channel('waiter-alerts-test')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notificacoes_garcom',
            filter: `restaurant_id=eq.${restaurantId}` 
        }, (payload) => {
            console.log("REALTIME RECEIVED WITH FILTER:", payload);
        })
        .subscribe((status, err) => {
            console.log("Subscribe status:", status, err || '');
        });
    
    setTimeout(async () => {
        console.log("Inserting dummy notification...");
        const { data, error } = await supabase.from('notificacoes_garcom').insert([{
            mesa_id: 'FILTER_TEST',
            restaurant_id: restaurantId
        }]).select();
        console.log("Insert result:", error ? error : data);
    }, 3000);

    setTimeout(() => {
        console.log("Test finished.");
        process.exit(0);
    }, 7000);
}

checkRealtimeFilter();
