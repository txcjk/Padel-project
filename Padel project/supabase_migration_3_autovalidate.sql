-- ============================================================
-- MIGRATION SCRIPT 3: Auto-validation des scores après 48h
-- ============================================================

-- 1. Ajout de la colonne pour suivre le moment du passage en Pending_Validation
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Fonction et Trigger pour mettre à jour status_updated_at automatiquement
CREATE OR REPLACE FUNCTION update_match_status_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_match_status_timestamp ON matches;

CREATE TRIGGER trg_update_match_status_timestamp
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_match_status_timestamp();

-- 3. Fonction pour auto-valider les matchs bloqués (48h en attente)
CREATE OR REPLACE FUNCTION auto_validate_stale_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Met à jour le statut en 'Completed' pour tous les matchs
  -- qui sont en 'Pending_Validation' depuis plus de 48 heures.
  -- Le trigger trg_calculate_elo s'exécutera automatiquement lors de ce changement.
  UPDATE matches
  SET status = 'Completed'
  WHERE status = 'Pending_Validation'
    AND status_updated_at <= NOW() - INTERVAL '48 hours';
END;
$$;

COMMENT ON FUNCTION auto_validate_stale_matches IS 'Valide automatiquement les matchs en attente de consensus depuis plus de 48h pour éviter les blocages.';

-- 4. Planification avec pg_cron (nécessite l'extension pg_cron activée)
-- Exécuter la fonction toutes les heures
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('auto-validate-matches', '0 * * * *', 'SELECT auto_validate_stale_matches();');
  END IF;
END $$;
