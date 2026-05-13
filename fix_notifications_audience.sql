-- 1. Add target_role column to system_notifications
ALTER TABLE public.system_notifications 
ADD COLUMN IF NOT EXISTS target_role VARCHAR(50) DEFAULT 'all';

-- 2. Update existing "NOVO CLIENTE" notifications to target ONLY super_admin
UPDATE public.system_notifications 
SET target_role = 'super_admin' 
WHERE message LIKE 'NOVO CLIENTE PENDENTE%';

-- 3. Update the handle_new_user trigger to set target_role = 'super_admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_restaurant_id uuid;
  user_full_name text;
  user_phone text;
  user_rest_name text;
BEGIN
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_phone := new.raw_user_meta_data->>'phone';
  user_rest_name := new.raw_user_meta_data->>'restaurant_name';

  if user_rest_name is null or user_rest_name = '' then
    user_rest_name := 'Restaurante de ' || coalesce(user_full_name, 'Cliente');
  end if;

  insert into public.profiles (id, email, role, status, full_name, phone)
  values (new.id, new.email, 'admin', 'pending', user_full_name, user_phone);

  insert into public.restaurants (name, slug, owner_id, plan, status)
  values (user_rest_name, 'restaurante-' || substr(md5(random()::text), 1, 6), new.id, 'start', 'suspended')
  returning id into new_restaurant_id;

  insert into public.system_notifications (message, type, is_active, created_by, target_role) 
  values (
    'NOVO CLIENTE PENDENTE: ' || coalesce(user_full_name, new.email) || ' (' || coalesce(user_phone, 'Sem Telf') || ') registou o restaurante "' || user_rest_name || '". Por favor, aprove o acesso no separador de Acessos.',
    'warning',
    true,
    new.id,
    'super_admin'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
