import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInventorySaving() {
  console.log("=== TESTING INVENTORY SAVING WITH AUTH ===");
  
  // 1. Try to login as owner (quintajulio8@hotmail.com)
  let authResult = await supabase.auth.signInWithPassword({
    email: 'quintajulio8@hotmail.com',
    password: 'password123'
  });
  
  if (authResult.error) {
    console.log("Auth with password123 failed, trying 123456:", authResult.error.message);
    authResult = await supabase.auth.signInWithPassword({
      email: 'quintajulio8@hotmail.com',
      password: '123456'
    });
  }
  
  if (authResult.error) {
    console.error("Auth failed entirely:", authResult.error.message);
    return;
  }
  
  console.log("Logged in successfully as:", authResult.data.user.email);
  
  // 2. Try to update a menu item
  const itemId = 'dedb768f-ee60-4f06-88a8-24fcde6295a2'; // Água Mineral
  console.log("Updating item:", itemId);
  
  const { data, error } = await supabase
    .from('menu_items')
    .update({ track_stock: true, stock_quantity: 15 })
    .eq('id', itemId)
    .select();
    
  console.log("UPDATE DATA:", data);
  console.log("UPDATE ERROR:", error);
}

testInventorySaving();
