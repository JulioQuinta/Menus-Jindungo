import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fullTest() {
    const itemId = 'b20e18dc-9d5f-4462-9490-acde3809d545'; // Bacalhau com Natas
    const restaurantId = 'def7479a-6c90-45e4-9d69-cae1aace983b';

    console.log("1. Setting stock of Bacalhau com Natas to 5...");
    await supabase.from('menu_items').update({ stock_quantity: 5 }).eq('id', itemId);

    console.log("2. Placing order for 1 Bacalhau com Natas...");
    const orderData = {
        restaurant_id: restaurantId,
        items: [
            {
                id: itemId,
                name: 'Bacalhau com Natas',
                quantity: 1,
                price: 8500
            }
        ],
        total: 8500,
        status: 'pending',
        customer_name: 'Test Decrement',
        customer_phone: '923000000',
        table_number: 'Mesa: 99'
    };

    const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single();

    if (error) {
        console.error("Order insertion failed:", error.message);
        return;
    }
    console.log("Order placed successfully! Order ID:", order.id);

    console.log("3. Inspecting stock of Bacalhau com Natas after order...");
    const { data: item } = await supabase.from('menu_items').select('stock_quantity').eq('id', itemId).single();
    console.log("Stock quantity in DB is:", item.stock_quantity);

    if (item.stock_quantity === 4) {
        console.log("SUCCESS: Stock successfully decremented from 5 to 4!");
    } else {
        console.log("FAILURE: Stock was not decremented correctly.");
    }

    console.log("4. Cleaning up... Resetting stock of Bacalhau com Natas back to 0...");
    await supabase.from('menu_items').update({ stock_quantity: 0 }).eq('id', itemId);
    
    console.log("5. Cleaning up... Deleting test order...");
    await supabase.from('orders').delete().eq('id', order.id);
    console.log("Clean up finished!");
}

fullTest();
