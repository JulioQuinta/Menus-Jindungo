-- 1. Create Status Enum for SaaS Control
CREATE TYPE restaurant_status AS ENUM ('active', 'expired', 'suspended', 'trial');

-- 2. Restaurants Table (Tenants)
CREATE TABLE restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- url-friendly-name
    logo_url TEXT,
    phone TEXT, -- for whatsapp orders
    
    -- SaaS Governance Fields
    status restaurant_status DEFAULT 'trial',
    subscription_end TIMESTAMP WITH TIME ZONE,
    admin_email TEXT, -- owner email

    -- Theme Config (JSONB for flexibility)
    theme_config JSONB DEFAULT '{
        "primaryColor": "#ff6b6b",
        "fontFamily": "Inter",
        "layoutMode": "list",
        "darkMode": false
    }'::jsonb
);

-- 3. Categories Table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Menu Items Table
CREATE TABLE menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price TEXT NOT NULL, -- keeping as text for '18.000 Kz' format flexibility, or change to numeric
    desc_text TEXT,      -- 'desc' is a reserved keyword in some SQL dialects
    img_url TEXT,
    
    -- Feature Flags
    is_highlight BOOLEAN DEFAULT false,
    badge TEXT,          -- 'Novo', 'Picante', etc.
    pairs_with TEXT,     -- Cross-sell suggestion
    
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row Level Security (RLS) & Policies

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read Access (Only Active Restaurants)
-- Anyone can view a restaurant and its menu IF the status is 'active' OR 'expired' (Read Only mode).
-- 'suspended' restaurants are hidden.

CREATE POLICY "Public Read Active/Expired Restaurants" ON restaurants
FOR SELECT USING (status IN ('active', 'expired', 'trial'));

CREATE POLICY "Public Read Categories" ON categories
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM restaurants r 
        WHERE r.id = categories.restaurant_id 
        AND r.status IN ('active', 'expired', 'trial')
    )
);

CREATE POLICY "Public Read Menu Items" ON menu_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM restaurants r 
        WHERE r.id = menu_items.restaurant_id 
        AND r.status IN ('active', 'expired', 'trial')
    )
);

-- Policy: Admin Write Access (simplified for now, ideally tied to auth.uid())
-- For development prototype, we allow public insert/update if they have the ID (Not secure for Prod!)
-- IN PRODUCTION: Change this to `auth.uid() = restaurants.owner_id`
CREATE POLICY "Dev Public Write" ON restaurants FOR ALL USING (true);
CREATE POLICY "Dev Public Write Cats" ON categories FOR ALL USING (true);
CREATE POLICY "Dev Public Write Items" ON menu_items FOR ALL USING (true);

-- 6. Insert Demo Data
INSERT INTO restaurants (name, slug, status, theme_config)
VALUES 
('Jindungo Demo', 'demo', 'active', '{
    "primaryColor": "#ff6b6b",
    "fontFamily": "Inter",
    "layoutMode": "list",
    "darkMode": false
}')
RETURNING id;
-- Copy the returned ID to use in frontend if needed, though frontend works with "on-the-fly" data too.
