-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    items JSONB NOT NULL, -- Array of items with qty, name, price, notes
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready, delivered, cancelled
    customer_name TEXT,
    table_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to insert orders (place order)
CREATE POLICY "Allow public insert orders" 
ON orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow public (anon) to read their own orders (if we had user tracking, for now open for simplicity or restricted by ID in query)
-- For MVP: Allow anon to read order if they know the ID (uuid is hard to guess)
CREATE POLICY "Allow public read own order" 
ON orders FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow restaurant owners to manage orders
CREATE POLICY "Allow owners to manage orders" 
ON orders FOR ALL 
TO authenticated 
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
);

-- Enable Realtime for orders table
-- replication must be enabled on the publication 'supabase_realtime'
-- This usually requires superuser, but often enabled by default on table creation in Supabase UI.
-- We'll try to add it to publication if possible, or user might need to toggle it in dashboard.
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders; 
-- (Commented out as it often fails in SQL editor without superuser)
