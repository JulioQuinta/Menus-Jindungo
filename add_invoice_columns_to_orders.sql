-- Migration: Add invoice columns to public.orders table for AGT compliance and electronic invoicing
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS request_id TEXT,
ADD COLUMN IF NOT EXISTS jws_hash TEXT,
ADD COLUMN IF NOT EXISTS validation_code TEXT;

-- Verify if there are existing records and default their status to 'draft'
UPDATE public.orders 
SET invoice_status = 'draft' 
WHERE invoice_status IS NULL;
