
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;

-- Automatically set the current user's restaurant to TRIAL for testing
UPDATE restaurants 
SET is_trial = TRUE 
WHERE owner_id = auth.uid();
