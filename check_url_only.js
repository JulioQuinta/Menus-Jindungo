
import dotenv from 'dotenv';
dotenv.config();

const forcedUrl = "https://dntbzdlliymbworzqowb.supabase.co/storage/v1/object/public/logos/c5b635a1-7c8f-4202-82be-a5fb25ccd6c3-1771207250559.jpg";

async function check() {
    console.log(`Checking URL: ${forcedUrl}`);
    try {
        const response = await fetch(forcedUrl);
        console.log(`Status: ${response.status} ${response.statusText}`);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

check();
