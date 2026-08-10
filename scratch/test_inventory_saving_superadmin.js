import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInventorySavingSuperAdmin() {
  console.log("=== TESTING INVENTORY SAVING WITH SUPER ADMIN AUTH ===");
  
  // Login as super_admin (julioquinta8@gmail.com)
  const authResult = await supabase.auth.signInWithPassword({
    email: 'julioquinta8@gmail.com',
    password: 'password123'
  });
  
  if (authResult.error) {
    console.error("Auth failed:", authResult.error.message);
    return;
  }
  
  console.log("Logged in successfully as:", authResult.data.user.email);
  
  // Try to update a menu item of Comidas da Terra
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

testInventorySavingSuperAdmin();
