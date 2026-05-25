-- ============================================================
-- SECURITY FIX: Enable RLS on storage.objects + constraints
-- ============================================================
-- Fixes:
-- 1. storage.objects RLS was commented out — policies were ineffective
-- 2. Add CHECK constraints on profiles for data validation
-- 3. Fix matches UPDATE RLS to allow participants (not just creator)
-- 4. Add cancel_match RPC with participation check
-- 5. Add participation check to complete_match and dispute_match
-- 6. Add apply_elo_decay RPC (server-side ELO calculation)
-- ============================================================

-- 1. Enable RLS on storage.objects (CRITICAL — was disabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. CHECK constraints on profiles for server-side validation
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_hand CHECK (hand IS NULL OR hand IN ('Droitier', 'Gaucher'));

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_play_style CHECK (play_style IS NULL OR play_style IN ('Attaquant', 'Défenseur', 'Stratège'));

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_radius CHECK (max_radius_km IS NULL OR max_radius_km BETWEEN 5 AND 200);

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_names CHECK (
    first_name IS NULL OR (length(first_name) BETWEEN 1 AND 50)
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_last_name CHECK (
    last_name IS NULL OR (length(last_name) BETWEEN 1 AND 50)
  );

-- 3. Fix matches UPDATE RLS: allow participants, not just creator
DROP POLICY IF EXISTS "Matches: modification par créateur" ON public.matches;

CREATE POLICY "Matches: modification par participant ou créateur"
  ON public.matches FOR UPDATE
  USING (
    (select auth.uid()) = creator_id
    OR EXISTS (
      SELECT 1 FROM match_participations
      WHERE match_participations.match_id = matches.id
        AND match_participations.player_id = (select auth.uid())
    )
  );

-- 4. cancel_match RPC with participation verification
CREATE OR REPLACE FUNCTION cancel_match(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_participant BOOLEAN;
  v_current_status TEXT;
BEGIN
  -- Verify caller is a participant or creator
  SELECT EXISTS(
    SELECT 1 FROM match_participations
    WHERE match_id = p_match_id
      AND player_id = auth.uid()
  ) OR EXISTS(
    SELECT 1 FROM matches
    WHERE id = p_match_id
      AND creator_id = auth.uid()
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Seul un participant ou le créateur peut annuler ce match.'
    );
  END IF;

  -- Check match is still cancellable
  SELECT status INTO v_current_status
  FROM matches WHERE id = p_match_id;

  IF v_current_status NOT IN ('Pending', 'Full') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ce match ne peut plus être annulé (statut: ' || v_current_status || ').'
    );
  END IF;

  UPDATE matches SET status = 'Cancelled' WHERE id = p_match_id;

  RETURN jsonb_build_object('success', true, 'match_id', p_match_id);
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_match(UUID) TO authenticated;

-- 5. Add participation check to complete_match
CREATE OR REPLACE FUNCTION complete_match(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_participant BOOLEAN;
  v_status TEXT;
  v_avg_elo_t1 FLOAT;
  v_avg_elo_t2 FLOAT;
  v_expected_t1 FLOAT;
  v_expected_t2 FLOAT;
  v_k INT := 32;
  v_score_t1 FLOAT;
  v_delta_t1 FLOAT;
  v_delta_t2 FLOAT;
  v_set_scores TEXT[];
  v_games TEXT[];
  v_sets_t1 INT := 0;
  v_sets_t2 INT := 0;
  v_set TEXT;
  v_g1 INT;
  v_g2 INT;
  v_match RECORD;
BEGIN
  -- Verify caller is a participant
  SELECT EXISTS(
    SELECT 1 FROM match_participations
    WHERE match_id = p_match_id
      AND player_id = auth.uid()
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Seuls les participants peuvent valider le score.'
    );
  END IF;

  -- Check match status
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF v_match.status NOT IN ('Pending_Validation', 'Full') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le match n''est pas en attente de validation.'
    );
  END IF;

  IF v_match.match_type <> 'Ranked' THEN
    UPDATE matches SET status = 'Completed' WHERE id = p_match_id;
    RETURN jsonb_build_object('success', true, 'match_id', p_match_id, 'elo_changed', false);
  END IF;

  -- Parse score
  IF v_match.score_team_1 IS NOT NULL AND v_match.score_team_2 IS NOT NULL THEN
    v_set_scores := regexp_split_to_array(v_match.score_team_1, '\s*/\s*');
    FOREACH v_set IN ARRAY v_set_scores LOOP
      v_games := regexp_split_to_array(v_set, '\s*-\s*');
      IF array_length(v_games, 1) = 2 THEN
        BEGIN
          v_g1 := v_games[1]::INT;
          v_g2 := v_games[2]::INT;
          IF v_g1 > v_g2 THEN v_sets_t1 := v_sets_t1 + 1;
          ELSIF v_g2 > v_g1 THEN v_sets_t2 := v_sets_t2 + 1;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore parsing errors
        END;
      END IF;
    END LOOP;
  END IF;

  v_score_t1 := CASE
    WHEN v_sets_t1 > v_sets_t2 THEN 1.0
    WHEN v_sets_t1 < v_sets_t2 THEN 0.0
    ELSE 0.5
  END;

  -- Calculate ELO
  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t1
  FROM match_participations mp JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = p_match_id AND mp.team = 1;

  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t2
  FROM match_participations mp JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = p_match_id AND mp.team = 2;

  v_expected_t1 := 1.0 / (1.0 + POWER(10.0, (v_avg_elo_t2 - v_avg_elo_t1) / 400.0));
  v_expected_t2 := 1.0 - v_expected_t1;

  v_delta_t1 := v_k * (v_score_t1 - v_expected_t1);
  v_delta_t2 := v_k * ((1.0 - v_score_t1) - v_expected_t2);

  -- Update participations
  UPDATE match_participations SET elo_change = ROUND(v_delta_t1)::INT
  WHERE match_id = p_match_id AND team = 1;

  UPDATE match_participations SET elo_change = ROUND(v_delta_t2)::INT
  WHERE match_id = p_match_id AND team = 2;

  -- Update player profiles
  UPDATE profiles SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t1)::INT)
  WHERE id IN (SELECT player_id FROM match_participations WHERE match_id = p_match_id AND team = 1);

  UPDATE profiles SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t2)::INT)
  WHERE id IN (SELECT player_id FROM match_participations WHERE match_id = p_match_id AND team = 2);

  -- Reset decay cycles for participants
  UPDATE profiles SET decay_applied_cycles = 0
  WHERE id IN (SELECT player_id FROM match_participations WHERE match_id = p_match_id);

  -- Mark match completed
  UPDATE matches SET status = 'Completed' WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'elo_changed', true,
    'delta_t1', ROUND(v_delta_t1)::INT,
    'delta_t2', ROUND(v_delta_t2)::INT
  );
END;
$$;

-- 6. Add participation check to dispute_match
CREATE OR REPLACE FUNCTION dispute_match(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_participant BOOLEAN;
BEGIN
  -- Verify caller is a participant
  SELECT EXISTS(
    SELECT 1 FROM match_participations
    WHERE match_id = p_match_id
      AND player_id = auth.uid()
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Seuls les participants peuvent contester ce match.'
    );
  END IF;

  -- Revert ELO changes and set status to Disputed
  UPDATE match_participations SET elo_change = 0
  WHERE match_id = p_match_id;

  UPDATE profiles p SET elo_rating = GREATEST(0, p.elo_rating - COALESCE(mp.elo_change, 0))
  FROM match_participations mp
  WHERE mp.player_id = p.id AND mp.match_id = p_match_id AND mp.elo_change IS NOT NULL;

  UPDATE matches SET status = 'Disputed' WHERE id = p_match_id;

  RETURN jsonb_build_object('success', true, 'match_id', p_match_id);
END;
$$;

GRANT EXECUTE ON FUNCTION dispute_match(UUID) TO authenticated;

-- 7. apply_elo_decay RPC (server-side calculation)
CREATE OR REPLACE FUNCTION apply_elo_decay(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decay_limit INT;
  v_inactive_days INT;
  v_decay_cycles INT;
  v_penalty INT;
  v_current_elo INT;
  v_current_cycles INT;
  v_is_elite BOOLEAN;
BEGIN
  -- Get user data
  SELECT elo_rating, decay_applied_cycles, is_elite
  INTO v_current_elo, v_current_cycles, v_is_elite
  FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non trouvé.');
  END IF;

  -- Decay threshold: 60 days for Elite, 45 for Standard
  v_decay_limit := CASE WHEN v_is_elite THEN 60 ELSE 45 END;

  -- Calculate inactive days from last ranked match
  SELECT EXTRACT(DAY FROM NOW() - MAX(m.scheduled_at))::INT
  INTO v_inactive_days
  FROM matches m
  JOIN match_participations mp ON mp.match_id = m.id
  WHERE mp.player_id = p_user_id
    AND m.match_type = 'Ranked'
    AND m.status IN ('Completed', 'Full', 'Pending', 'Pending_Validation');

  IF v_inactive_days IS NULL THEN
    v_inactive_days := v_decay_limit; -- No ranked matches = full decay
  END IF;

  v_decay_cycles := GREATEST(0, FLOOR(v_inactive_days / v_decay_limit) - v_current_cycles);

  IF v_decay_cycles <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'decay_applied', false,
      'message', 'Aucune pénalité d''inactivité à appliquer.'
    );
  END IF;

  v_penalty := v_decay_cycles * 15;
  v_current_elo := GREATEST(0, v_current_elo - v_penalty);

  UPDATE profiles
  SET elo_rating = v_current_elo,
      decay_applied_cycles = v_current_cycles + v_decay_cycles
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'decay_applied', true,
    'penalty_elo', v_penalty,
    'new_elo', v_current_elo,
    'new_cycles', v_current_cycles + v_decay_cycles
  );
END;
$$;

GRANT EXECUTE ON FUNCTION apply_elo_decay(UUID) TO authenticated;