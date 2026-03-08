-- Script to create the system_notifications table

CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'danger', 'success'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS Policies
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can READ active notifications
CREATE POLICY "Anyone can read active notifications" 
    ON public.system_notifications 
    FOR SELECT 
    USING (is_active = true);

-- Only super_admin can CREATE/UPDATE/DELETE
-- We use a subquery to check the profile role
CREATE POLICY "Super Admins can manage notifications"
    ON public.system_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Allow admins to read all so they can manage them in super admin dashboard
CREATE POLICY "Super Admins can read all notifications" 
    ON public.system_notifications 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
