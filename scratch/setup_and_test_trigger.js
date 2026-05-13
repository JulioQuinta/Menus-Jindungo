import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function setupAndTest() {
    // 1. Find any item
    const { data: items } = await supabase.from('menu_items').select('*').limit(1);
    if (!items || items.length === 0) return console.log("No items found.");
    
    const item = items[0];
    console.log(`Setting up test for: ${item.name}`);
    
    // 2. Enable track_stock and set quantity to 10
    const { error: updateError } = await supabase
        .from('menu_items')
        .update({ track_stock: true, stock_quantity: 10 })
        .eq('id', item.id);
    
    if (updateError) return console.error("Error updating item:", updateError);
    
    // 3. Create order
    const testOrder = {
        restaurant_id: item.restaurant_id,
        items: [{ id: item.id, quantity: 2, name: item.name, price: item.price }],
        total: item.price * 2,
        status: 'pendente',
        customer_name: 'Test Bot'
    };
    
    const { data: order, error: orderError } = await supabase.from('orders').insert([testOrder]).select();
    if (orderError) return console.error("Error creating order:", orderError);
    
    console.log("Order created. Waiting...");
    await new Promise(r => setTimeout(r, 2000));
    
    // 4. Check stock
    const { data: updated } = await supabase.from('menu_items').select('stock_quantity').eq('id', item.id);
    const newStock = updated[0].stock_quantity;
    console.log(`Initial: 10, Final: ${newStock}`);
    
    if (newStock === 8) {
        console.log("SUCCESS: Trigger is working!");
    } else {
        console.log("FAILURE: Stock is " + newStock + " (expected 8).");
        console.log("Check if the trigger tr_decrement_stock exists on table 'orders'.");
    }
    
    // Cleanup
    await supabase.from('orders').delete().eq('id', order[0].id);
    await supabase.from('menu_items').update({ track_stock: false }).eq('id', item.id);
}

setupAndTest();
