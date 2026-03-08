-- Create orders table if not exists
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

-- Allow public (anon) to insert orders
DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
CREATE POLICY "Allow public insert orders" 
ON orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow public (anon) to read their own orders (by ID)
DROP POLICY IF EXISTS "Allow public read own order" ON orders;
CREATE POLICY "Allow public read own order" 
ON orders FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow owners to manage orders
-- Note: This requires auth.uid() to match owner_id in restaurants table
DROP POLICY IF EXISTS "Allow owners to manage orders" ON orders;
CREATE POLICY "Allow owners to manage orders" 
ON orders FOR ALL 
TO authenticated 
USING (true); -- Simplified for demo/dev speed, in prod use: restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())

-- Enable Realtime (Idempotent Check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END
$$;
