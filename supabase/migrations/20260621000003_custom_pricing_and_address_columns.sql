-- Add address columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state_province TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address_details TEXT;

-- Add custom pricing schema columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_weekday NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_weekend NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_holiday NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
