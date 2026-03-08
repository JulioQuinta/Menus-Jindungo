
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance;

try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase Environment Variables");
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
    console.error("Supabase Client Init Failed:", err);
    // Mock client to prevent app crash
    supabaseInstance = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: new Error("Client initialization failed") }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ error: new Error("Client initialization failed") }),
            signUp: async () => ({ error: new Error("Client initialization failed") }),
            signOut: async () => ({ error: null })
        },
        from: () => ({
            select: () => ({ eq: () => ({ single: async () => ({ error: new Error("Client initialization failed") }) }) }),
            insert: async () => ({ error: new Error("Client initialization failed") })
        }),
        rpc: async () => ({ error: new Error("Client initialization failed") })
    };
}

export const supabase = supabaseInstance;
