-- Create Waiter Notifications Table
CREATE TABLE IF NOT EXISTS notificacoes_garcom (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mesa_id TEXT NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'atendido'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id)
);

-- Enable Realtime (Idempotent Check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notificacoes_garcom'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes_garcom;
  END IF;
END
$$;

-- Policies
ALTER TABLE notificacoes_garcom ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to insert (Client calling waiter)
DROP POLICY IF EXISTS "Clients can insert notifications" ON notificacoes_garcom;
CREATE POLICY "Clients can insert notifications" 
ON notificacoes_garcom FOR INSERT 
WITH CHECK (true);

-- Allow Admin (authenticated/anon for now as per project state) to view/update
DROP POLICY IF EXISTS "Admins can view notifications" ON notificacoes_garcom;
CREATE POLICY "Admins can view notifications" 
ON notificacoes_garcom FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can update notifications" ON notificacoes_garcom;
CREATE POLICY "Admins can update notifications" 
ON notificacoes_garcom FOR UPDATE 
USING (true);
