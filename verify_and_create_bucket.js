
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("1. Listing Buckets...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("List Error:", JSON.stringify(listError, null, 2));
    } else {
        console.log("Buckets found:", buckets.map(b => b.name));
        const logoBucket = buckets.find(b => b.name === 'logos');

        if (!logoBucket) {
            console.log("2. 'logos' bucket NOT found. Attempting to create...");
            const { data, error: createError } = await supabase.storage.createBucket('logos', {
                public: true
            });
            if (createError) {
                console.error("Create Error:", JSON.stringify(createError, null, 2));
            } else {
                console.log("Bucket 'logos' created successfully!", data);
            }
        } else {
            console.log("2. 'logos' bucket exists.");
        }
    }

    console.log("3. Attempting test upload...");
    try {
        const filePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(filePath, 'Hello World');
        const fileContent = fs.readFileSync(filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('logos')
            .upload('test_script_upload.txt', fileContent, {
                upsert: true,
                contentType: 'text/plain'
            });

        if (uploadError) {
            console.error("Upload Error:", JSON.stringify(uploadError, null, 2));
        } else {
            console.log("Upload Success:", uploadData);
        }
    } catch (err) {
        console.error("Script File Error:", err);
    }
}

run();
