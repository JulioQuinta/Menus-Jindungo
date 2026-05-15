import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntbzdlliymbworzqowb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGJ6ZGxsaXltYndvcnpxb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5NTEsImV4cCI6MjA4NDIzODk1MX0.Jy5VfnJzCxzWeSqiHZpnJW1ffox8AcYcpYFeh2Kj1mg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkThemeConfig() {
    const restId = 'def7479a-6c90-45e4-9d69-cae1aace983b';
    const { data, error } = await supabase.from('restaurants').select('theme_config').eq('id', restId).single();
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("theme_config:", data.theme_config);
    }
}

checkThemeConfig();
