ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can insert their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Public can view restaurants by slug" ON restaurants;

CREATE POLICY "Users can view their own restaurant" ON restaurants FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can update their own restaurant" ON restaurants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert their own restaurant" ON restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Public can view restaurants by slug" ON restaurants FOR SELECT USING (true);
