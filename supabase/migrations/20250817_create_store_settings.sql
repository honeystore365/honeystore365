-- Ensure pgcrypto extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table store_settings if it doesn't exist
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name VARCHAR(255) NOT NULL,
  store_description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'TND',
  delivery_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on store_settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'store_settings'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'update_store_settings_updated_at'
    ) THEN
      DROP TRIGGER update_store_settings_updated_at ON public.store_settings;
    END IF;
    CREATE TRIGGER update_store_settings_updated_at
      BEFORE UPDATE ON public.store_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Add delivery_fee column if table existed without it
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;

-- Seed a default row if none exists
INSERT INTO public.store_settings (store_name, currency, delivery_fee)
SELECT 'Mon Magasin', 'TND', 0
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);
