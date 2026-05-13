require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function runSQL() {
  const sql = `
    create or replace function public.handle_new_user()
    returns trigger as $$
    declare
      new_restaurant_id uuid;
    begin
      -- 1. Cria o perfil de admin
      insert into public.profiles (id, email, role)
      values (new.id, new.email, 'admin');

      -- 2. Cria o restaurante por defeito com plano 'start'
      insert into public.restaurants (
        name, 
        slug, 
        owner_id, 
        plan, 
        is_active
      )
      values (
        'Meu Restaurante', 
        'restaurante-' || substr(md5(random()::text), 1, 6), 
        new.id, 
        'start', 
        true
      );

      return new;
    end;
    $$ language plpgsql security definer;
  `;

  // We need to use postgres function to execute raw SQL, but standard supabase-js cannot execute raw DDL easily unless there is an RPC.
  // Actually, I can just create the SQL file and tell the user to run it in the Supabase Dashboard. This is much safer and guaranteed to work for DDL.
}
runSQL();
