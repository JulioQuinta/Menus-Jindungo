-- 1. Adicionar campos de nome e telefone à tabela profiles (se não existirem)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 1.5. Remover a limitação que bloqueava o estado "pending"
DO $$ 
DECLARE
    const_name text;
BEGIN
    SELECT tc.constraint_name INTO const_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'profiles' 
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'status';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

-- 2. Atualizar o gatilho (trigger) de criação de novos utilizadores
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_restaurant_id uuid;
  user_full_name text;
  user_phone text;
  user_rest_name text;
begin
  -- Extrair dados enviados pelo formulário de registo
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_phone := new.raw_user_meta_data->>'phone';
  user_rest_name := new.raw_user_meta_data->>'restaurant_name';

  -- Se não enviarem nome de restaurante, usamos um genérico
  if user_rest_name is null or user_rest_name = '' then
    user_rest_name := 'Restaurante de ' || coalesce(user_full_name, 'Cliente');
  end if;

  -- 1. Cria o perfil de administrador para o novo cliente (COMO PENDENTE)
  insert into public.profiles (id, email, role, status, full_name, phone)
  values (new.id, new.email, 'admin', 'pending', user_full_name, user_phone);

  -- 2. Cria automaticamente o restaurante (Inativo até aprovação)
  insert into public.restaurants (
    name, 
    slug, 
    owner_id, 
    plan, 
    status
  )
  values (
    user_rest_name, 
    'restaurante-' || substr(md5(random()::text), 1, 6), 
    new.id, 
    'start', 
    'suspended' -- ou 'pending' se tivermos esse estado em restaurants
  )
  returning id into new_restaurant_id;

  -- 3. Cria uma Notificação de Sistema para o Super Admin ver
  insert into public.system_notifications (
    message,
    type,
    is_active,
    created_by
  ) values (
    'NOVO CLIENTE PENDENTE: ' || coalesce(user_full_name, new.email) || ' (' || coalesce(user_phone, 'Sem Telf') || ') registou o restaurante "' || user_rest_name || '". Por favor, aprove o acesso no separador de Acessos.',
    'warning',
    true,
    new.id
  );

  return new;
end;
$$ language plpgsql security definer;
