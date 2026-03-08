import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log("Testing upload to 'menus' bucket...");

    // Create a dummy text file to act as our "logo" for testing
    const testContent = "This is a test logo file";
    const fileName = `logos/test_upload_${Date.now()}.txt`;

    // We are trying to upload anonymously or as an Anon user.
    // Our RLS policy says Authenticated users only for insert.
    // If this fails with 401 or RLS error, it proves the bucket exists but policies work!

    const { data, error } = await supabase.storage
        .from('menus')
        .upload(fileName, testContent, {
            contentType: 'text/plain',
            upsert: true
        });

    if (error) {
        console.error("Upload Error (Expected if not logged in):", error.message);

        // Let's at least check if the bucket is recognized now
        const { data: buckets } = await supabase.storage.listBuckets();
        const menusBucketExists = buckets?.find(b => b.name === 'menus');
        if (menusBucketExists) {
            console.log("✅ Bucket 'menus' is successfully created and verified!");
            if (error.message.includes('row-level security')) {
                console.log("✅ RLS Policies are active and blocking anonymous uploads, which is CORRECT.");
            }
        } else {
            console.log("❌ Bucket 'menus' still not found.");
        }
    } else {
        console.log("Upload Success! (Warning: public uploads might be on?) Data:", data);

        // Test fetching the public URL
        const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
        console.log("Public URL:", publicUrl);
    }
}

testUpload();
