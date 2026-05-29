-- Run this once in Supabase SQL Editor
-- Seeds default brand color values into site_settings

INSERT INTO site_settings (key, value) VALUES
  ('brand_primary',    '#FF6D1F'),
  ('brand_background', '#222222'),
  ('brand_cream',      '#FAF3E1'),
  ('brand_beige',      '#F5E7C6')
ON CONFLICT (key) DO NOTHING;
