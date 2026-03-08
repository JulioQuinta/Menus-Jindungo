-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view_menu', 'scan_qr', 'click_item'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users (public menu visitors) to insert events
CREATE POLICY "Allow public insert to analytics" 
ON analytics_events FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Allow restaurant owners to view their own analytics
CREATE POLICY "Allow owners to view own analytics" 
ON analytics_events FOR SELECT 
TO authenticated 
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
);

-- Helper function to get 7 days stats efficiently
CREATE OR REPLACE FUNCTION get_weekly_stats(rest_id UUID)
RETURNS TABLE (
    date TEXT,
    views BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(day, 'MM/DD') as date,
        COUNT(e.id) as views
    FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'::interval
    ) as day
    LEFT JOIN analytics_events e 
        ON date_trunc('day', e.created_at) = day 
        AND e.restaurant_id = rest_id
        AND e.event_type = 'view_menu'
    GROUP BY day
    ORDER BY day;
END;
$$ LANGUAGE plpgsql;
