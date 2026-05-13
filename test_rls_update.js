import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const supabaseUser = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testRLS() {
    console.log("Setting up test...");
    
    // 1. Get the pending user ID
    const { data: pendingUsers } = await supabaseAdmin.from('profiles').select('*').eq('status', 'pending').limit(1);
    if (!pendingUsers || pendingUsers.length === 0) {
        console.log("No pending users to test.");
        return;
    }
    const pendingUserId = pendingUsers[0].id;
    console.log("Target Pending User:", pendingUserId);

    // 2. Create a temporary super admin
    const email = `super_temp_${Date.now()}@example.com`;
    const password = 'password123';
    
    console.log("Creating temp super admin:", email);
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    
    if (authErr) {
        console.error("Auth err:", authErr);
        return;
    }
    
    const adminId = authData.user.id;
    
    // Give super admin role
    await supabaseAdmin.from('profiles').update({ role: 'super_admin' }).eq('id', adminId);
    
    // 3. Login as this super admin
    console.log("Logging in...");
    await supabaseUser.auth.signInWithPassword({ email, password });
    
    // 4. Try to update the pending user
    console.log("Attempting to approve user...");
    const { data, error } = await supabaseUser.from('profiles').update({ status: 'active' }).eq('id', pendingUserId).select();
    
    console.log("Result Error:", error);
    console.log("Result Data:", data);
    
    // Cleanup
    await supabaseUser.auth.signOut();
    await supabaseAdmin.auth.admin.deleteUser(adminId);
    console.log("Cleanup done.");
}

testRLS();
