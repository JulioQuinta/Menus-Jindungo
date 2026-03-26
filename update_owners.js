import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const mappings = [
    { email: 'juliopitra8@gmail.com', password: '123456', restaurantName: 'Quinta das Quintas' },
    { email: 'juliotest02@gmail.com', password: '123456', restaurantName: 'Restaurante Demo' },
    { email: 'juliotest01@gmail.com', password: '123456', restaurantName: 'Jindungo Demo' },
    { email: 'tipitarus@gmail.com', password: '123456', restaurantName: 'Restaurante Dikuzimba' }
];

let logs = '';
function log(msg) { logs += msg + '\n'; console.log(msg); }

async function run() {
    for (const mapping of mappings) {
        log(`\nProcessing user: ${mapping.email}`);
        
        // 1. Try to sign up
        let userId = null;
        let { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: mapping.email,
            password: mapping.password,
            options: { data: { role: 'owner' } } // Optional metadata
        });

        if (signUpError && signUpError.message.includes('User already registered')) {
            log('User already exists, trying to sign in...');
            let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: mapping.email,
                password: mapping.password
            });
            if (signInError) {
                log(`Sign in error for ${mapping.email}: ${signInError.message}`);
                // Also get the user from profiles to bypass login if auth fails due to password but user exists
                const { data: prof } = await supabase.from('profiles').select('id').ilike('email', mapping.email).maybeSingle();
                if (prof) {
                    log(`Found profile without login: ${prof.id}`);
                    userId = prof.id;
                }
            } else {
                log(`Successfully signed in. User ID: ${signInData.user.id}`);
                userId = signInData.user.id;
            }
        } else if (signUpError) {
            log(`Sign up error for ${mapping.email}: ${signUpError.message}`);
        } else {
            log(`Successfully signed up. User ID: ${signUpData.user.id}`);
            userId = signUpData.user.id;
        }

        if (!userId) {
            // Last resort: find by email in profiles
            const { data: prof } = await supabase.from('profiles').select('id').ilike('email', mapping.email).maybeSingle();
            if (prof) {
                log(`Fallback: Found profile: ${prof.id}`);
                userId = prof.id;
            } else {
                log(`Could not get User ID for ${mapping.email}, skipping...`);
                continue;
            }
        }

        // 2. Fetch the restaurant
        const { data: rests, error: rErr } = await supabase
            .from('restaurants')
            .select('id, name')
            .ilike('name', `%${mapping.restaurantName.replace('Quinta das Quintas', 'Quinta das Quinta').replace('Jindungo Demo', 'Jindungo Demo')}%`);
            
        if (rErr || !rests || rests.length === 0) {
            log(`Restaurant similar to "${mapping.restaurantName}" not found.`);
            // List all restaurants for debugging
            const { data: allRests } = await supabase.from('restaurants').select('name');
            log("Available names: " + allRests.map(r => r.name).join(', '));
            continue;
        }

        // we might have more than one hit, take the closest match, or just the first
        const restId = rests[0].id;
        log(`Found Restaurant: ${rests[0].name} (ID: ${restId})`);

        // Force update the restaurant owner using RPC or normal update if RLS allows
        const { error: updateErr } = await supabase
            .from('restaurants')
            .update({ owner_id: userId })
            .eq('id', restId);

        if (updateErr) {
            log(`Failed to update ${rests[0].name} owner: ${updateErr.message}`);
            log('Trying to update via profile/admin user...');
        } else {
            log(`✅ Updated ${rests[0].name} owner to ${mapping.email}`);
        }
        
        // Also ensure profile has role 'owner' or 'admin' 
        const { error: profileErr } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId);
        
        if (profileErr) {
            log(`Failed to update profile role: ${profileErr.message}`);
        }
    }
    fs.writeFileSync('logs_update.txt', logs, 'utf8');
}

run();
