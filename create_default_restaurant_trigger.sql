-- Atualiza o gatilho (trigger) de criação de novos utilizadores
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_restaurant_id uuid;
begin
  -- 1. Cria o perfil de administrador para o novo cliente
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin');

  -- 2. Cria automaticamente um restaurante associado com o plano 'start'
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
