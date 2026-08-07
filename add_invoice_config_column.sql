-- Add invoice_config to restaurants table for layout and AGT compliance
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS invoice_config JSONB DEFAULT '{
    "nif": "5417289301",
    "address": "Edificio y-18, Centralidade do Kilamba",
    "certification_number": "000/JINDUNGO",
    "software_version": "v3.1",
    "layout_color": "#D4AF37",
    "show_logo": true,
    "invoice_footer_note": "Regime Geral de Faturação (IVA 14%)",
    "vat_rate": 14,
    "exemption_code": "",
    "exemption_reason": ""
}'::jsonb;
