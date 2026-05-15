import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntbzdlliymbworzqowb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGJ6ZGxsaXltYndvcnpxb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5NTEsImV4cCI6MjA4NDIzODk1MX0.Jy5VfnJzCxzWeSqiHZpnJW1ffox8AcYcpYFeh2Kj1mg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
    const { data: restaurants } = await supabase.from('restaurants').select('id, name');
    console.log("RESTAURANTS:");
    restaurants.forEach(r => console.log(`- ${r.name}: ${r.id}`));
}

checkIds();
