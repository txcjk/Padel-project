-- ============================================================
-- MIGRATION 12: Index, RPC dispute_match, optimisations
-- ============================================================

-- ************************************************************
-- 1. INDEX MANQUANTS
-- ************************************************************

-- FK indexes (accélèrent les JOINs)
CREATE INDEX IF NOT EXISTS idx_participations_player 
  ON match_participations(player_id);

CREATE INDEX IF NOT EXISTS idx_participations_match 
  ON match_participations(match_id);

CREATE INDEX IF NOT EXISTS idx_reviews_match 
  ON reviews(match_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed 
  ON reviews(reviewed_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer 
  ON reviews(reviewer_id);

-- Status + scheduling (accélère les filtres fréquents)
CREATE INDEX IF NOT EXISTS idx_matches_status_scheduled 
  ON matches(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_matches_urgent 
  ON matches(is_last_urgent, status) 
  WHERE is_last_urgent = TRUE;

-- Spatial indexes (accélère ST_DWithin)
CREATE INDEX IF NOT EXISTS idx_profiles_location_gist 
  ON profiles USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_matches_location_gist 
  ON matches USING GIST(location_match);

-- ************************************************************
-- 2. RPC: dispute_match()
-- ************************************************************
-- Annule un match complété et revert les changements ELO.
-- Remplace le code client défaillant (App.jsx:625-661).
-- ************************************************************

CREATE OR REPLACE FUNCTION dispute_match(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_participation RECORD;
  v_reverted_count INT := 0;
BEGIN
  -- Vérifier que le match existe et est Completed
  SELECT * INTO v_match
  FROM matches
  WHERE id = p_match_id AND status = 'Completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match non trouvé ou non complété (id: %)', p_match_id;
  END IF;

  -- Revert ELO pour chaque joueur
  FOR v_participation IN
    SELECT player_id, elo_change
    FROM match_participations
    WHERE match_id = p_match_id AND elo_change IS NOT NULL AND elo_change != 0
  LOOP
    UPDATE profiles
    SET elo_rating = GREATEST(0, elo_rating - v_participation.elo_change)
    WHERE id = v_participation.player_id;

    -- Reset elo_change sur la participation
    UPDATE match_participations
    SET elo_change = 0
    WHERE match_id = p_match_id AND player_id = v_participation.player_id;

    v_reverted_count := v_reverted_count + 1;
  END LOOP;

  -- Changer le statut du match
  UPDATE matches
  SET 
    status = 'Disputed',
    score_team_1 = NULL,
    score_team_2 = NULL
  WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'reverted_players', v_reverted_count,
    'new_status', 'Disputed'
  );
END;
$$;

-- ************************************************************
-- 3. RPC: complete_match()
-- ************************************************************
-- Version atomique du flow de complétion de match.
-- Met à jour le statut ET stocke elo_change dans participations.
-- ************************************************************

CREATE OR REPLACE FUNCTION complete_match(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_avg_elo_t1 FLOAT;
  v_avg_elo_t2 FLOAT;
  v_expected_t1 FLOAT;
  v_score_t1 FLOAT;
  v_delta_t1 FLOAT;
  v_delta_t2 FLOAT;
  v_k INT := 32;
  v_participation RECORD;
BEGIN
  -- Vérifier que le match est en attente de validation
  SELECT * INTO v_match
  FROM matches
  WHERE id = p_match_id AND status IN ('Pending_Validation', 'Full');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match non trouvé ou déjà complété (id: %)', p_match_id;
  END IF;

  -- Calculer ELO moyen par équipe
  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t1
  FROM match_participations mp
  JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = p_match_id AND mp.team = 1;

  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t2
  FROM match_participations mp
  JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = p_match_id AND mp.team = 2;

  -- Espérance de gain
  v_expected_t1 := 1.0 / (1.0 + POWER(10.0, (v_avg_elo_t2 - v_avg_elo_t1) / 400.0));

  -- Déterminer le vainqueur
  v_score_t1 := CASE
    WHEN v_match.score_team_1 IS NULL OR v_match.score_team_2 IS NULL THEN 0.5
    WHEN v_match.score_team_1 > v_match.score_team_2 THEN 1.0
    WHEN v_match.score_team_1 < v_match.score_team_2 THEN 0.0
    ELSE 0.5
  END;

  -- Calculer les deltas
  v_delta_t1 := v_k * (v_score_t1 - v_expected_t1);
  v_delta_t2 := v_k * ((1.0 - v_score_t1) - (1.0 - v_expected_t1));

  -- Mettre à jour ELO et stocker elo_change pour chaque joueur équipe 1
  FOR v_participation IN
    SELECT player_id FROM match_participations WHERE match_id = p_match_id AND team = 1
  LOOP
    UPDATE profiles
    SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t1)::INT)
    WHERE id = v_participation.player_id;

    UPDATE match_participations
    SET elo_change = ROUND(v_delta_t1)::INT
    WHERE match_id = p_match_id AND player_id = v_participation.player_id;
  END LOOP;

  -- Mettre à jour ELO et stocker elo_change pour chaque joueur équipe 2
  FOR v_participation IN
    SELECT player_id FROM match_participations WHERE match_id = p_match_id AND team = 2
  LOOP
    UPDATE profiles
    SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t2)::INT)
    WHERE id = v_participation.player_id;

    UPDATE match_participations
    SET elo_change = ROUND(v_delta_t2)::INT
    WHERE match_id = p_match_id AND player_id = v_participation.player_id;
  END LOOP;

  -- Incrémenter matches_saved_count pour les joueurs "Last"
  IF v_match.is_last_urgent = TRUE THEN
    UPDATE profiles
    SET matches_saved_count = matches_saved_count + 1
    WHERE id IN (
      SELECT player_id FROM match_participations
      WHERE match_id = p_match_id AND joined_via_last = TRUE
    );
  END IF;

  -- Changer le statut
  UPDATE matches SET status = 'Completed' WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'elo_delta_t1', ROUND(v_delta_t1)::INT,
    'elo_delta_t2', ROUND(v_delta_t2)::INT
  );
END;
$$;

-- Accorder l'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION dispute_match(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_match(UUID) TO authenticated;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
