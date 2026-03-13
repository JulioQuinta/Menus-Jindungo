-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_id UUID REFERENCES orders(id),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_name TEXT
);

-- Enable RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public) to insert feedback
CREATE POLICY "Allow public insert feedbacks" 
ON feedbacks FOR INSERT 
WITH CHECK (true);

-- Allow restaurant owners to select their own feedbacks
CREATE POLICY "Allow restaurant owners select feedbacks" 
ON feedbacks FOR SELECT 
USING (auth.uid() IN (
    SELECT owner_id FROM restaurants WHERE id = feedbacks.restaurant_id
));

-- Grant access
GRANT ALL ON feedbacks TO anon, authenticated, service_role;
