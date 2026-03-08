-- Add potentially missing columns to the menu_items table
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS img_url TEXT;
