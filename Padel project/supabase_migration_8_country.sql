-- ============================================================
-- MIGRATION SCRIPT 8: Ajout de la colonne pays (country)
-- ============================================================

-- 1. Ajout de la colonne country à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France';

COMMENT ON COLUMN public.profiles.country IS 'Pays de résidence du joueur (ex: France).';
