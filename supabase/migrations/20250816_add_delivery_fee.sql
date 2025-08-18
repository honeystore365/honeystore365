-- Add delivery_fee column to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;