-- Add simplified metadata and JSON support to public.properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS custom_rates JSONB DEFAULT '[]'::jsonb;
