-- ============================================================
-- MIGRATION 21: Bypass du calcul d'Elo pour les Matchs Casual/Amical
-- ============================================================

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

  -- Si le match est Casual ou Amical, on ignore le calcul et la mise à jour d'Elo
  IF v_match.type = 'Casual' OR v_match.type = 'Amical' THEN
    -- Mettre simplement elo_change = 0 pour toutes les participations du match
    UPDATE match_participations
    SET elo_change = 0
    WHERE match_id = p_match_id;

    -- Changer le statut du match en Completed
    UPDATE matches SET status = 'Completed' WHERE id = p_match_id;

    RETURN jsonb_build_object(
      'success', true,
      'match_id', p_match_id,
      'elo_delta_t1', 0,
      'elo_delta_t2', 0,
      'type', v_match.type,
      'message', 'Match amical validé sans modification d Elo.'
    );
  END IF;

  -- Calculer ELO moyen par équipe (Seulement pour les matchs Ranked)
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
    'elo_delta_t2', ROUND(v_delta_t2)::INT,
    'type', v_match.type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_match(UUID) TO authenticated;
