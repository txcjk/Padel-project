-- ============================================================
-- MIGRATION: Add official_website_url column to clubs
-- ============================================================

-- 1. Add column to public.clubs table
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS official_website_url TEXT;

-- 2. Populate the new column with existing website values
UPDATE public.clubs 
SET official_website_url = website 
WHERE website IS NOT NULL AND official_website_url IS NULL;
