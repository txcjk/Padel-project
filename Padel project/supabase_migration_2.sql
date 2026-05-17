-- ============================================================
-- MIGRATION SCRIPT 2: Ajout des champs de Profiling Gamifiés
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hand TEXT CHECK (hand IN ('Droitier', 'Gaucher')) DEFAULT 'Droitier',
ADD COLUMN IF NOT EXISTS play_style TEXT CHECK (play_style IN ('Attaquant', 'Défenseur', 'Stratège')) DEFAULT 'Stratège',
ADD COLUMN IF NOT EXISTS club TEXT DEFAULT 'Padel Arena',
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'Nouvelle-Aquitaine';

COMMENT ON COLUMN profiles.hand IS 'Préférence latérale du joueur';
COMMENT ON COLUMN profiles.play_style IS 'Style de jeu tactique';
COMMENT ON COLUMN profiles.club IS 'Club de rattachement principal';
COMMENT ON COLUMN profiles.region IS 'Région de résidence pour les classements régionaux';
