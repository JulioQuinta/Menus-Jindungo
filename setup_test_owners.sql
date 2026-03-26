-- Script de configuração de Donos de Teste
-- Como o envio de e-mails gratuitos pelo Supabase tem limites, este script
-- insere os utilizadores de teste diretamente com a palavra-passe "123456" 
-- como confirmados, para que não precisem de e-mail de ativação.

DO $$
DECLARE
    uid1 uuid := gen_random_uuid();
    uid2 uuid := gen_random_uuid();
    uid3 uuid := gen_random_uuid();
    uid4 uuid := gen_random_uuid();
BEGIN
    -- 1. Inserir Utilizadores se não existirem
    -- Quinta das Quinta -> juliopitra8@gmail.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'juliopitra8@gmail.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (uid1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juliopitra8@gmail.com', crypt('123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"owner"}', now(), now(), '', '', '', '');
    ELSE
        SELECT id INTO uid1 FROM auth.users WHERE email = 'juliopitra8@gmail.com';
        -- Update the password just in case
        UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid1;
    END IF;

    -- Restaurante Demo -> juliotest02@gmail.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'juliotest02@gmail.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (uid2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juliotest02@gmail.com', crypt('123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"owner"}', now(), now(), '', '', '', '');
    ELSE
        SELECT id INTO uid2 FROM auth.users WHERE email = 'juliotest02@gmail.com';
        UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid2;
    END IF;

    -- Jindungo Demo -> juliotest01@gmail.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'juliotest01@gmail.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (uid3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juliotest01@gmail.com', crypt('123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}', now(), now(), '', '', '', '');
    ELSE
        SELECT id INTO uid3 FROM auth.users WHERE email = 'juliotest01@gmail.com';
        UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid3;
    END IF;

    -- Restaurante Dikuzimba -> tipitarus@gmail.com
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tipitarus@gmail.com') THEN
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES (uid4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tipitarus@gmail.com', crypt('123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"owner"}', now(), now(), '', '', '', '');
    ELSE
        SELECT id INTO uid4 FROM auth.users WHERE email = 'tipitarus@gmail.com';
        UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid4;
    END IF;

    -- Garantir que os perfis existem e têm o status ativo com permissão elevada
    UPDATE public.profiles SET role = 'admin', status = 'active' WHERE id IN (uid1, uid2, uid3, uid4);

    -- 2. Atualizar o dono dos restaurantes
    UPDATE public.restaurants SET owner_id = uid1 WHERE name ILIKE '%Quinta das Quinta%';
    UPDATE public.restaurants SET owner_id = uid2 WHERE name ILIKE '%Restaurante Demo%';
    UPDATE public.restaurants SET owner_id = uid3 WHERE name ILIKE '%Jindungo Demo%';
    UPDATE public.restaurants SET owner_id = uid4 WHERE name ILIKE '%Dikuzimba%';

END $$;
