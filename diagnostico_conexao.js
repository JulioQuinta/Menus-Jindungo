import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log("--- DIAGNÓSTICO JINDUNGO ---");
console.log("URL:", url);
console.log("Teste de conexão iniciado...");

const supabase = createClient(url, key);

async function diagnostico() {
    try {
        const start = Date.now();
        const { data, error } = await Promise.race([
            supabase.from('restaurants').select('id').limit(1),
            new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 8000))
        ]);

        if (error) {
            console.error("ERRO SUPABASE:", error.message);
            if (error.message.includes('fetch')) {
                console.log("\n>>> CAUSA PROVÁVEL: O projeto Supabase está DESLIGADO (Paused) ou a sua rede está a bloquear o acesso.");
            }
        } else {
            console.log("SUCESSO: Conexão estabelecida em " + (Date.now() - start) + "ms");
        }
    } catch (err) {
        console.error("ERRO DE REDE:", err.message);
        if (err.message === "TIMEOUT" || err.message.includes('fetch')) {
            console.log("\n>>> CAUSA PROVÁVEL: Projeto Supabase 'dntbzdlliymbworzqowb' não responde.");
            console.log(">>> AÇÃO: Vá ao dashboard.supabase.com e verifique se o projeto está 'PAUSED' (Pausado).");
        }
    }
}

diagnostico();
