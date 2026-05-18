-- ============================================================
-- MIGRATION SCRIPT 4: Sécurisation complète + Colonnes
-- ============================================================
-- Corrige : écarts schéma/frontend, RLS, search_path,
-- SECURITY DEFINER exposure, performance RLS.
-- À exécuter APRÈS les migrations 1, 2, 3.
-- ============================================================

-- ************************************************************
-- 1. COLONNES MANQUANTES (alignement frontend)
-- ************************************************************

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS club TEXT DEFAULT 'Padel Arena',
  ADD COLUMN IF NOT EXISTS elo_min INT DEFAULT 800,
  ADD COLUMN IF NOT EXISTS elo_max INT DEFAULT 2000;

COMMENT ON COLUMN matches.club IS 'Nom du club / lieu du match.';
COMMENT ON COLUMN matches.elo_min IS 'Elo minimum requis pour rejoindre le match.';
COMMENT ON COLUMN matches.elo_max IS 'Elo maximum autorisé pour rejoindre le match.';

ALTER TABLE public.match_participations
  ADD COLUMN IF NOT EXISTS elo_change INT DEFAULT 0;

COMMENT ON COLUMN match_participations.elo_change IS 'Variation Elo du joueur après ce match.';

-- ************************************************************
-- 2. CHECK CONSTRAINT — Pending_Validation
-- ************************************************************

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('Pending', 'Full', 'Pending_Validation', 'Completed', 'Cancelled'));

-- ************************************************************
-- 3. FONCTIONS — search_path fixé + SECURITY DEFINER safe
-- ************************************************************

-- 3.1 Trigger ELO (appelé uniquement par trigger, pas par API)
CREATE OR REPLACE FUNCTION calculate_elo_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_elo_t1  FLOAT;
  v_avg_elo_t2  FLOAT;
  v_expected_t1 FLOAT;
  v_expected_t2 FLOAT;
  v_k           INT := 32;
  v_score_t1    FLOAT;
  v_delta_t1    FLOAT;
  v_delta_t2    FLOAT;

  -- variables pour le parsing du score
  v_set_scores  TEXT[];
  v_games       TEXT[];
  v_sets_t1     INT := 0;
  v_sets_t2     INT := 0;
  v_set         TEXT;
  v_g1          INT;
  v_g2          INT;
BEGIN
  IF NEW.match_type <> 'Ranked' THEN RETURN NEW; END IF;
  IF OLD.status = 'Completed' OR NEW.status <> 'Completed' THEN RETURN NEW; END IF;

  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t1
  FROM match_participations mp JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = NEW.id AND mp.team = 1;

  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t2
  FROM match_participations mp JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = NEW.id AND mp.team = 2;

  v_expected_t1 := 1.0 / (1.0 + POWER(10.0, (v_avg_elo_t2 - v_avg_elo_t1) / 400.0));
  v_expected_t2 := 1.0 - v_expected_t1;

  -- Découpage et parsing du score (ex: "6-4 / 3-6 / 6-2") pour déterminer le vrai vainqueur
  IF NEW.score_team_1 IS NOT NULL AND NEW.score_team_2 IS NOT NULL THEN
    v_set_scores := regexp_split_to_array(NEW.score_team_1, '\s*/\s*');
    FOREACH v_set IN ARRAY v_set_scores LOOP
      v_games := regexp_split_to_array(v_set, '\s*-\s*');
      IF array_length(v_games, 1) = 2 THEN
        BEGIN
          v_g1 := v_games[1]::INT;
          v_g2 := v_games[2]::INT;
          IF v_g1 > v_g2 THEN
            v_sets_t1 := v_sets_t1 + 1;
          ELSIF v_g2 > v_g1 THEN
            v_sets_t2 := v_sets_t2 + 1;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore les erreurs de conversion pour rester tolérant
        END;
      END IF;
    END LOOP;
  END IF;

  v_score_t1 := CASE
    WHEN v_sets_t1 > v_sets_t2 THEN 1.0
    WHEN v_sets_t1 < v_sets_t2 THEN 0.0
    ELSE 0.5
  END;

  v_delta_t1 := v_k * (v_score_t1 - v_expected_t1);
  v_delta_t2 := v_k * ((1.0 - v_score_t1) - v_expected_t2);

  UPDATE match_participations SET elo_change = ROUND(v_delta_t1)::INT
  WHERE match_id = NEW.id AND team = 1;

  UPDATE match_participations SET elo_change = ROUND(v_delta_t2)::INT
  WHERE match_id = NEW.id AND team = 2;

  UPDATE profiles SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t1)::INT)
  WHERE id IN (SELECT player_id FROM match_participations WHERE match_id = NEW.id AND team = 1);

  UPDATE profiles SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t2)::INT)
  WHERE id IN (SELECT player_id FROM match_participations WHERE match_id = NEW.id AND team = 2);

  IF NEW.is_last_urgent = TRUE THEN
    UPDATE profiles SET matches_saved_count = matches_saved_count + 1
    WHERE id IN (
      SELECT player_id FROM match_participations
      WHERE match_id = NEW.id AND joined_via_last = TRUE
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Bloquer l'appel direct via API (trigger uniquement)
REVOKE EXECUTE ON FUNCTION calculate_elo_match() FROM anon, authenticated;

-- 3.2 Fair play score (trigger uniquement, supporte INSERT, UPDATE et DELETE)
CREATE OR REPLACE FUNCTION update_fair_play_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id   UUID;
  v_avg_score   FLOAT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_id := OLD.reviewed_id;
  ELSE
    v_target_id := NEW.reviewed_id;
  END IF;

  SELECT AVG((punctuality_score + behavior_score) / 2.0) * 20.0
  INTO v_avg_score
  FROM reviews WHERE reviewed_id = v_target_id;

  IF v_avg_score IS NOT NULL THEN
    UPDATE profiles
    SET fair_play_score = LEAST(100, GREATEST(0, ROUND(v_avg_score)::INT))
    WHERE id = v_target_id;
  ELSE
    UPDATE profiles
    SET fair_play_score = 100
    WHERE id = v_target_id;
  END IF;

  UPDATE profiles
  SET punctuality_rate = LEAST(100, GREATEST(0, COALESCE((
    SELECT ROUND(AVG(punctuality_score) * 20.0)::INT
    FROM reviews WHERE reviewed_id = v_target_id
  ), 100)))
  WHERE id = v_target_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_fair_play_score() FROM anon, authenticated;

-- Recréation du trigger fair-play pour supporter INSERT, UPDATE et DELETE
DROP TRIGGER IF EXISTS trg_update_fair_play ON reviews;
CREATE TRIGGER trg_update_fair_play
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_fair_play_score();

-- 3.3 Check fair play eligibility (trigger uniquement)
CREATE OR REPLACE FUNCTION check_fair_play_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fp_score    INT;
  v_match_type  TEXT;
  v_is_last     BOOLEAN;
BEGIN
  SELECT fair_play_score INTO v_fp_score FROM profiles WHERE id = NEW.player_id;
  SELECT match_type, is_last_urgent INTO v_match_type, v_is_last FROM matches WHERE id = NEW.match_id;

  IF v_fp_score < 70 AND (v_match_type = 'Ranked' OR v_is_last = TRUE) THEN
    RAISE EXCEPTION
      'Joueur % bloqué : fair_play_score (%) inférieur à 70. Accès Ranked/Last refusé.',
      NEW.player_id, v_fp_score;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_fair_play_eligibility() FROM anon, authenticated;

-- 3.4 Fonctions utilitaires (appelables par utilisateurs authentifiés)
CREATE OR REPLACE FUNCTION find_matches_within_radius(
  p_user_id UUID,
  p_radius_km INT DEFAULT NULL
)
RETURNS SETOF matches
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_location  GEOGRAPHY;
  v_radius    INT;
BEGIN
  SELECT location, max_radius_km INTO v_location, v_radius
  FROM profiles WHERE id = p_user_id;

  IF v_location IS NULL THEN
    RETURN QUERY SELECT * FROM matches
      WHERE status IN ('Pending', 'Full') AND scheduled_at > NOW();
    RETURN;
  END IF;

  v_radius := COALESCE(p_radius_km, v_radius, 30);

  RETURN QUERY
    SELECT m.* FROM matches m
    WHERE m.status IN ('Pending', 'Full')
      AND m.scheduled_at > NOW()
      AND m.location_match IS NOT NULL
      AND ST_DWithin(m.location_match, v_location, v_radius * 1000)
    ORDER BY m.scheduled_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION find_matches_within_radius(UUID, INT) FROM anon;

CREATE OR REPLACE FUNCTION find_last_urgent_matches(
  p_user_id UUID
)
RETURNS SETOF matches
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_location  GEOGRAPHY;
  v_radius    INT;
BEGIN
  SELECT location, max_radius_km INTO v_location, v_radius
  FROM profiles WHERE id = p_user_id;

  v_radius := COALESCE(v_radius, 50);

  RETURN QUERY
    SELECT m.* FROM matches m
    WHERE m.is_last_urgent = TRUE
      AND m.status = 'Pending'
      AND m.scheduled_at > NOW()
      AND (
        v_location IS NULL
        OR m.location_match IS NULL
        OR ST_DWithin(m.location_match, v_location, v_radius * 1000)
      )
    ORDER BY m.scheduled_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION find_last_urgent_matches(UUID) FROM anon;

-- 3.5 Auto-validation (cron, pas exposée via API)
CREATE OR REPLACE FUNCTION auto_validate_stale_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE matches SET status = 'Completed'
  WHERE status = 'Pending_Validation'
    AND status_updated_at <= NOW() - INTERVAL '48 hours';
END;
$$;

REVOKE EXECUTE ON FUNCTION auto_validate_stale_matches() FROM anon, authenticated;

-- 3.6 Update status timestamp (trigger)
CREATE OR REPLACE FUNCTION update_match_status_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_match_status_timestamp() FROM anon, authenticated;

-- ************************************************************
-- 4. VUE revealed_reviews — SANS SECURITY DEFINER
-- ************************************************************

DROP VIEW IF EXISTS public.revealed_reviews;

CREATE OR REPLACE VIEW public.revealed_reviews 
WITH (security_invoker = true) AS
SELECT r.id, r.match_id, r.reviewer_id, r.reviewed_id,
       r.punctuality_score, r.behavior_score, r.created_at
FROM reviews r
WHERE
  -- Condition A : 48h écoulées depuis le match
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = r.match_id
    AND m.scheduled_at <= NOW() - INTERVAL '48 hours'
  )
  OR
  -- Condition B : tous les joueurs ont soumis leurs reviews
  (
    SELECT COUNT(DISTINCT reviewer_id)
    FROM reviews r2
    WHERE r2.match_id = r.match_id
  ) >= (
    SELECT COUNT(*)
    FROM match_participations mp
    WHERE mp.match_id = r.match_id
  );

COMMENT ON VIEW public.revealed_reviews
  IS 'Reviews visibles après 48h OU quand tous ont noté. Vue SECURITY INVOKER (hérite du RLS caller).';

-- ************************************************************
-- 5. RLS — DROP + RECREATE avec (select auth.uid()) pour perf
-- ************************************************************

-- 5.1 Profiles
DROP POLICY IF EXISTS "Profiles: lecture publique" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: modification par propriétaire" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: suppression par propriétaire" ON public.profiles;

CREATE POLICY "Profiles: lecture publique"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Profiles: modification par propriétaire"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "Profiles: suppression par propriétaire"
  ON public.profiles FOR DELETE
  USING ((select auth.uid()) = id);

-- 5.2 Matches
DROP POLICY IF EXISTS "Matches: lecture publique" ON public.matches;
DROP POLICY IF EXISTS "Matches: création par authentifié" ON public.matches;
DROP POLICY IF EXISTS "Matches: modification par créateur" ON public.matches;
DROP POLICY IF EXISTS "Matches: annulation par créateur si Pending" ON public.matches;

CREATE POLICY "Matches: lecture publique"
  ON public.matches FOR SELECT USING (true);

CREATE POLICY "Matches: création par authentifié"
  ON public.matches FOR INSERT
  WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Matches: modification par créateur"
  ON public.matches FOR UPDATE
  USING ((select auth.uid()) = creator_id);

CREATE POLICY "Matches: annulation par créateur si Pending"
  ON public.matches FOR DELETE
  USING ((select auth.uid()) = creator_id AND status = 'Pending');

-- 5.3 Match participations
DROP POLICY IF EXISTS "Participations: lecture publique" ON public.match_participations;
DROP POLICY IF EXISTS "Participations: inscription par le joueur" ON public.match_participations;
DROP POLICY IF EXISTS "Participations: quitter un match Pending" ON public.match_participations;

CREATE POLICY "Participations: lecture publique"
  ON public.match_participations FOR SELECT USING (true);

CREATE POLICY "Participations: inscription par le joueur"
  ON public.match_participations FOR INSERT
  WITH CHECK ((select auth.uid()) = player_id);

CREATE POLICY "Participations: quitter un match Pending"
  ON public.match_participations FOR DELETE
  USING (
    (select auth.uid()) = player_id
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_participations.match_id
      AND matches.status = 'Pending'
    )
  );

-- 5.4 Reviews
DROP POLICY IF EXISTS "Reviews: soumission par le reviewer" ON public.reviews;
DROP POLICY IF EXISTS "Reviews: lecture propre" ON public.reviews;
DROP POLICY IF EXISTS "Reviews: reviewer voit ses soumissions" ON public.reviews;
DROP POLICY IF EXISTS "Reviews: suppression par reviewer dans 24h" ON public.reviews;

CREATE POLICY "Reviews: soumission par le reviewer"
  ON public.reviews FOR INSERT
  WITH CHECK ((select auth.uid()) = reviewer_id);

CREATE POLICY "Reviews: reviewer voit ses soumissions"
  ON public.reviews FOR SELECT
  USING ((select auth.uid()) = reviewer_id);

CREATE POLICY "Reviews: suppression par reviewer dans 24h"
  ON public.reviews FOR DELETE
  USING (
    (select auth.uid()) = reviewer_id
    AND created_at >= NOW() - INTERVAL '24 hours'
  );

-- ************************************************************
-- 6. POSTGIS — RLS sur spatial_ref_sys (table système)
-- ************************************************************

-- ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "spatial_ref_sys: lecture publique"
--   ON public.spatial_ref_sys FOR SELECT USING (true);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
