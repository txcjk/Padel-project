-- ============================================================
-- MIGRATION 11: Contraintes critiques (audit Phase 1)
-- ============================================================
-- 1. Trigger: Empêcher plus de 4 joueurs par match
-- 2. Trigger: Empêcher l'auto-review (se noter soi-même)
-- 3. Contrainte unique: Un seul review par joueur par match
-- ============================================================

-- ************************************************************
-- 1. CONTRAINTE 4 JOUEURS MAX
-- ************************************************************
-- Empêche l'insertion d'un 5ème joueur dans un match.
-- Résout la race condition côté client (App.jsx:444).
-- ************************************************************

CREATE OR REPLACE FUNCTION enforce_max_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM match_participations
  WHERE match_id = NEW.match_id;

  IF v_count >= 4 THEN
    RAISE EXCEPTION 'Match complet : 4 joueurs maximum autorisés.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_max_participants
  BEFORE INSERT ON match_participations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_participants();

-- ************************************************************
-- 2. EMPÊCHER L'AUTO-REVIEW
-- ************************************************************
-- Un joueur ne peut pas se noter lui-même.
-- Doublonne la contrainte CHECK existante mais plus explicite.
-- ************************************************************

CREATE OR REPLACE FUNCTION prevent_self_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reviewer_id = NEW.reviewed_id THEN
    RAISE EXCEPTION 'Impossible de se noter soi-même.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_review
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_review();

-- ************************************************************
-- 3. CONTRAINTE UNIQUE SUR REVIEWS
-- ************************************************************
-- Un joueur ne peut soumettre qu'une seule review par match.
-- Empêche les doublons (double-clic, race condition).
-- ************************************************************

-- D'abord, nettoyer les doublons éventuels existants
DELETE FROM reviews a
USING reviews b
WHERE a.id > b.id
  AND a.reviewer_id = b.reviewer_id
  AND a.match_id = b.match_id;

-- Ajouter la contrainte unique
ALTER TABLE reviews
  ADD CONSTRAINT unique_review_per_match
  UNIQUE (reviewer_id, match_id);

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
