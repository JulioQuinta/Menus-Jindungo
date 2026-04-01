import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAddStaff() {
    // 1. Get any restaurant
    const { data: rests } = await supabase.from('restaurants').select('id').limit(1);
    if (!rests || rests.length === 0) {
        console.error("No restaurants found.");
        return;
    }
    const restaurantId = rests[0].id;
    
    console.log("Signing in as owner...");
    const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: 'juliopitra8@gmail.com',
        password: '123456'
    });
    if (signInErr) {
        console.error("Owner Login Failed:", signInErr.message);
        return;
    }

    console.log("Testing insert into staff_members for restaurant:", restaurantId);
    
    // 2. Try to insert
    const { data, error } = await supabase
        .from('staff_members')
        .insert([{
            restaurant_id: restaurantId,
            name: 'Teste Debug',
            role: 'waiter',
            pin_code: '9876',
            email: 'debug_test@gmail.com'
        }]);
        
    if (error) {
        console.error("❌ SUPABASE ERROR DETAILS:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("✅ SUCCESS:", data);
        // Clean up
        const { data: insData } = await supabase.from('staff_members').select('id').eq('email', 'debug_test@gmail.com');
        if (insData && insData[0] && insData[0].id) {
             await supabase.from('staff_members').delete().eq('id', insData[0].id);
        }
    }
}

testAddStaff();
