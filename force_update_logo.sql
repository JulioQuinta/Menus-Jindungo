
-- Update ALL restaurants to use the last uploaded logo (from screenshot)
UPDATE restaurants
SET theme_config = jsonb_set(
    theme_config, 
    '{logoUrl}', 
    '"https://dntbzdlliymbworzqowb.supabase.co/storage/v1/object/public/logos/c5b635a1-7c8f-4202-82be-a5fb25ccd6c3-1771207250559.jpg"'::jsonb
);

-- Also fix any potential RLS mishaps by ensuring public select just in case
-- (already done, but good measure)
