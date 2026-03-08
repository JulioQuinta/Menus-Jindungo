-- FIX PUBLIC ACCESS (RLS) FOR RESTAURANTS, CATEGORIES, AND MENU ITEMS

-- 1. Restaurants: Allow PUBLIC read access
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public restaurants are viewable by everyone" ON restaurants;
CREATE POLICY "Public restaurants are viewable by everyone" 
ON restaurants FOR SELECT 
USING (true); -- Ideally restrict to status = 'active' later

-- 2. Categories: Allow PUBLIC read access
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;
CREATE POLICY "Public categories are viewable by everyone" 
ON categories FOR SELECT 
USING (true);

-- 3. Menu Items: Allow PUBLIC read access
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public menu_items are viewable by everyone" ON menu_items;
CREATE POLICY "Public menu_items are viewable by everyone" 
ON menu_items FOR SELECT 
USING (true); -- Ideally restrict to available = true

-- 4. ENSURE DEMO-RESTAURANT EXISTS
-- This creates a placeholder "demo-restaurant" if one doesn't exist yet, to fix the specific error you're seeing.
INSERT INTO restaurants (name, slug, status, subscription_end)
VALUES ('Restaurante Demo', 'demo-restaurant', 'active', NOW() + INTERVAL '1 year')
ON CONFLICT (slug) DO NOTHING;
