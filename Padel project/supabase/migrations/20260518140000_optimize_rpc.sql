-- ============================================================
-- MIGRATION 13: Optimisation RPC find_last_urgent_matches
-- ============================================================
-- Intègre le COUNT des participants directement dans le RPC
-- pour éviter le N+1 query côté client.
-- ============================================================

-- Supprimer l'ancienne fonction (ReturnType différent)
DROP FUNCTION IF EXISTS find_last_urgent_matches(UUID);

CREATE OR REPLACE FUNCTION find_last_urgent_matches(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  match_type TEXT,
  is_last_urgent BOOLEAN,
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  score_team_1 TEXT,
  score_team_2 TEXT,
  location_match GEOGRAPHY,
  created_at TIMESTAMPTZ,
  club TEXT,
  elo_min INT,
  elo_max INT,
  participant_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location GEOGRAPHY;
  v_radius INT;
BEGIN
  SELECT location, max_radius_km INTO v_location, v_radius
  FROM profiles WHERE id = p_user_id;

  v_radius := COALESCE(v_radius, 50);

  RETURN QUERY
    SELECT 
      m.id,
      m.creator_id,
      m.match_type,
      m.is_last_urgent,
      m.scheduled_at,
      m.status,
      m.score_team_1,
      m.score_team_2,
      m.location_match,
      m.created_at,
      m.club,
      m.elo_min,
      m.elo_max,
      COUNT(mp.id) AS participant_count
    FROM matches m
    LEFT JOIN match_participations mp ON mp.match_id = m.id
    WHERE m.is_last_urgent = TRUE
      AND m.status = 'Pending'
      AND m.scheduled_at > NOW()
      AND (
        v_location IS NULL
        OR m.location_match IS NULL
        OR ST_DWithin(m.location_match, v_location, v_radius * 1000)
      )
    GROUP BY m.id, m.creator_id, m.match_type, m.is_last_urgent,
             m.scheduled_at, m.status, m.score_team_1, m.score_team_2,
             m.location_match, m.created_at, m.club, m.elo_min, m.elo_max
    ORDER BY m.scheduled_at ASC;
END;
$$;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
