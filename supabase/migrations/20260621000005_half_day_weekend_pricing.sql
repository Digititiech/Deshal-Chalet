-- Add half-day weekday and weekend rates columns to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_half_day_weekday NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_half_day_weekend NUMERIC;
