import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAddingAndUpdating() {
  console.log("=== TESTING ADDING AND UPDATING ITEM ===");
  
  // 1. Auth as owner
  const authResult = await supabase.auth.signInWithPassword({
    email: 'quintajulio8@hotmail.com',
    password: '123456'
  });
  
  if (authResult.error) {
    console.error("Auth failed:", authResult.error.message);
    return;
  }
  
  console.log("Auth success!");
  
  // 2. Create a new item (similar to MenuManager)
  const restId = 'def7479a-6c90-45e4-9d69-cae1aace983b';
  // Let's find first category id
  const { data: cats } = await supabase.from('categories').select('id').eq('restaurant_id', restId).limit(1);
  if (!cats || cats.length === 0) {
    console.error("No categories found");
    return;
  }
  const catId = cats[0].id;
  
  console.log("Creating new menu item in category:", catId);
  const newItemPayload = {
    restaurant_id: restId,
    category_id: catId,
    name: 'Prato Teste Stock 2',
    price: '2500',
    desc_text: 'Descrição teste',
    available: true,
    track_stock: false,
    stock_quantity: 50
  };
  
  const { data: createdData, error: createError } = await supabase
    .from('menu_items')
    .insert([newItemPayload])
    .select()
    .single();
    
  if (createError) {
    console.error("Error creating item:", createError);
    return;
  }
  
  console.log("Created Item:", createdData.name, "ID:", createdData.id);
  
  // 3. Update the newly created item (similar to InventoryManager)
  console.log("Updating stock for the newly created item...");
  const updatePayload = {
    track_stock: true,
    stock_quantity: 10
  };
  
  const { data: updatedData, error: updateError } = await supabase
    .from('menu_items')
    .update(updatePayload)
    .eq('id', createdData.id)
    .select();
    
  console.log("UPDATE DATA:", updatedData);
  console.log("UPDATE ERROR:", updateError);
  
  // Clean up
  console.log("Deleting test item...");
  await supabase.from('menu_items').delete().eq('id', createdData.id);
}

testAddingAndUpdating();
