-- ------------------------------------------------------------
-- Fix RLS Policies for Categories and Menu Items
-- ------------------------------------------------------------

-- Enable RLS on both tables (if not already enabled)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Policies for Categories
-- ------------------------------------------------------------
-- Allow PUBLIC to read categories (for the public menu)
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" 
ON public.categories FOR SELECT 
USING (true);

-- Allow RESTAURANT OWNERS (admin role) to INSERT/UPDATE/DELETE their own categories
DROP POLICY IF EXISTS "Owners can manage categories" ON public.categories;
CREATE POLICY "Owners can manage categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

-- ------------------------------------------------------------
-- Policies for Menu Items
-- ------------------------------------------------------------
-- Allow PUBLIC to read menu items (for the public menu)
DROP POLICY IF EXISTS "Public can view menu_items" ON public.menu_items;
CREATE POLICY "Public can view menu_items" 
ON public.menu_items FOR SELECT 
USING (true);

-- Allow RESTAURANT OWNERS (admin role) to INSERT/UPDATE/DELETE their own menu items
DROP POLICY IF EXISTS "Owners can manage menu items" ON public.menu_items;
CREATE POLICY "Owners can manage menu items" 
ON public.menu_items FOR ALL 
TO authenticated 
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

-- Additionally, make sure restaurants table also has proper policies!
-- Since we are here, let's ensure owners can read/update their restaurants.
-- (Public can read all restaurants is usually standard for this app setup)

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view restaurants" ON public.restaurants;
CREATE POLICY "Public can view restaurants"
ON public.restaurants FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners can update their restaurant" ON public.restaurants;
CREATE POLICY "Owners can update their restaurant"
ON public.restaurants FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- We don't usually let owners delete restaurants, so we omit DELETE.
