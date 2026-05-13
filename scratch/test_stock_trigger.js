import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTrigger() {
    // We can't check system tables easily with the anon key if RLS is on, 
    // but we can try to run an RPC or just assume if we can't see it.
    // Alternatively, we can try to insert a test order and see if stock changes.
    
    console.log("Checking for trigger by performing a test...");
    
    // 1. Get a menu item with track_stock = true
    const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('track_stock', true)
        .limit(1);
    
    if (itemError || !items || items.length === 0) {
        console.log("No item found with track_stock = true. Please create one first.");
        return;
    }
    
    const item = items[0];
    const initialStock = item.stock_quantity;
    console.log(`Item found: ${item.name}, Initial Stock: ${initialStock}`);
    
    // 2. Create a dummy order
    console.log("Creating test order...");
    const testOrder = {
        restaurant_id: item.restaurant_id,
        items: [{ id: item.id, quantity: 1, name: item.name, price: item.price }],
        total_price: item.price,
        status: 'pendente',
        customer_name: 'Test Stock Bot',
        order_type: 'dine_in'
    };
    
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([testOrder])
        .select();
    
    if (orderError) {
        console.error("Error creating order:", orderError);
        return;
    }
    
    console.log("Order created. Waiting for trigger...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Check stock again
    const { data: updatedItems, error: updateError } = await supabase
        .from('menu_items')
        .select('stock_quantity')
        .eq('id', item.id);
    
    if (updateError || !updatedItems) {
        console.error("Error fetching updated stock:", updateError);
        return;
    }
    
    const newStock = updatedItems[0].stock_quantity;
    console.log(`New Stock: ${newStock}`);
    
    if (newStock < initialStock) {
        console.log("SUCCESS: Trigger is working!");
    } else {
        console.log("FAILURE: Stock did not change. Trigger might not be installed or working.");
    }
    
    // Cleanup: Delete test order
    if (order && order[0]) {
        await supabase.from('orders').delete().eq('id', order[0].id);
    }
}

checkTrigger();
