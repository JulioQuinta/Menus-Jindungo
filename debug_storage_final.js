
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStorage() {
    console.log("Debugging Storage...");

    // 1. List Buckets
    // NOTE: This usually fails for Anon, but returns empty, not throw.
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.log("Bucket List Error (Expected):", listError.message);
    } else {
        console.log("Buckets (Note: Anon can only see public):", buckets.map(b => b.name));
    }

    // 2. Upload Dummy File
    const dummyFile = Buffer.from('TEST LOGO CONTENT');
    const fileName = `debug_logo_${Date.now()}.txt`;

    console.log(`Attempting upload to 'logos/${fileName}'...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, dummyFile, {
            contentType: 'text/plain',
            upsert: true
        });

    if (uploadError) {
        console.error("UPLOAD FAILED:", JSON.stringify(uploadError, null, 2));
        return;
    }

    console.log("UPLOAD SUCCESS:", uploadData);

    // 3. Check Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

    console.log("Public URL:", publicUrl);

    // 4. Fetch Public URL to verify access
    const forcedUrl = "https://dntbzdlliymbworzqowb.supabase.co/storage/v1/object/public/logos/c5b635a1-7c8f-4202-82be-a5fb25ccd6c3-1771207250559.jpg";
    try {
        console.log(`Checking forced URL: ${forcedUrl}`);
        const response = await fetch(forcedUrl);
        if (response.ok) {
            console.log("FORCED URL ACCESS OK (200)");
        } else {
            console.error(`FORCED URL ACCESS FAILED (${response.status})`);
        }
    } catch (e) {
        console.error("Fetch Check Failed:", e.message);
    }
}

debugStorage();
