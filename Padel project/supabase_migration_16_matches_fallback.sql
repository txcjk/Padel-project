-- ============================================================
-- MIGRATION 16: Résilience et Compatibilité Double Schéma matches
-- ============================================================
-- Garantit l'existence de la table 'matches' et ajoute les colonnes
-- requises pour la compatibilité avec les requêtes Vercel.
-- ============================================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Ajouter les colonnes requises si elles n'existent pas
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE matches ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS date_time TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS slots_available INT DEFAULT 1;

-- Conserver l'ancienne compatibilité si nécessaire
ALTER TABLE matches ADD COLUMN IF NOT EXISTS club TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_last_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- Créer un index sur 'is_urgent' et 'is_last_urgent' pour optimiser les alertes LAST
CREATE INDEX IF NOT EXISTS idx_matches_is_urgent ON matches(is_urgent);
CREATE INDEX IF NOT EXISTS idx_matches_is_last_urgent ON matches(is_last_urgent);
