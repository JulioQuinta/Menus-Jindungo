import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchSchema() {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    const json = await res.json();
    
    fs.writeFileSync('schema_dump.json', JSON.stringify(json, null, 2));
    console.log("Schema dumped to schema_dump.json");
}

fetchSchema();
