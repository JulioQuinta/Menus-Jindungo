-- Add owner_id to restaurants table to link with Supabase Auth
-- Use DO block to check if column exists before adding to avoid error on multiple runs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'owner_id') THEN
        ALTER TABLE restaurants ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update RLS policies to be secure
-- DROP OLD DEV POLICIES
DROP POLICY IF EXISTS "Dev Public Write" ON restaurants;
DROP POLICY IF EXISTS "Dev Public Write Cats" ON categories;
DROP POLICY IF EXISTS "Dev Public Write Items" ON menu_items;

-- DROP EXISTING PRODUCTION POLICIES (To avoid "already exists" errors on re-run)
DROP POLICY IF EXISTS "Public Read Active/Expired Restaurants" ON restaurants; -- Setup default was this name
DROP POLICY IF EXISTS "Public Read Restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owner Write Restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owner Insert Restaurants" ON restaurants;

DROP POLICY IF EXISTS "Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Owner Write Categories" ON categories;

DROP POLICY IF EXISTS "Public Read Menu Items" ON menu_items;
DROP POLICY IF EXISTS "Owner Write Menu Items" ON menu_items;

-- 1. Restaurants: Public Read, Owner Write
CREATE POLICY "Public Read Restaurants" ON restaurants
FOR SELECT USING (status IN ('active', 'expired', 'trial'));

CREATE POLICY "Owner Write Restaurants" ON restaurants
FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Owner Insert Restaurants" ON restaurants
FOR INSERT WITH CHECK (auth.uid() = owner_id);


-- 2. Categories: Public Read, Owner Write
CREATE POLICY "Public Read Categories" ON categories
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM restaurants r 
        WHERE r.id = categories.restaurant_id 
        AND r.status IN ('active', 'expired', 'trial')
    )
);

CREATE POLICY "Owner Write Categories" ON categories
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM restaurants r
        WHERE r.id = categories.restaurant_id
        AND r.owner_id = auth.uid()
    )
);

-- 3. Menu Items: Public Read, Owner Write
CREATE POLICY "Public Read Menu Items" ON menu_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM restaurants r 
        WHERE r.id = menu_items.restaurant_id 
        AND r.status IN ('active', 'expired', 'trial')
    )
);

CREATE POLICY "Owner Write Menu Items" ON menu_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM restaurants r
        WHERE r.id = menu_items.restaurant_id
        AND r.owner_id = auth.uid()
    )
);
