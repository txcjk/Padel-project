-- ============================================================
-- PADEL APP — Script d'initialisation Supabase (PostgreSQL)
-- ============================================================
-- Compatible Supabase. Inclut : extensions, tables, fonctions
-- PL/pgSQL, triggers, vues sécurisées, contraintes d'intégrité.
-- ============================================================

-- ************************************************************
-- 1. EXTENSIONS
-- ************************************************************
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ************************************************************
-- 2. TABLES
-- ************************************************************

-- ------------------------------------------------------------
-- 2.1 PROFILES (liée à auth.users via id)
-- ------------------------------------------------------------
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  city          TEXT,
  location      GEOGRAPHY(Point, 4326),  -- longitude/latitude
  max_radius_km INT DEFAULT 30,
  elo_rating    INT DEFAULT 1000,
  fair_play_score INT DEFAULT 100
    CHECK (fair_play_score >= 0 AND fair_play_score <= 100),
  matches_saved_count INT DEFAULT 0,
  punctuality_rate INT DEFAULT 100
    CHECK (punctuality_rate >= 0 AND punctuality_rate <= 100),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Profils joueurs, lié 1:1 à auth.users.';
COMMENT ON COLUMN profiles.location IS 'Position géographique pour le matchmaking par rayon.';
COMMENT ON COLUMN profiles.matches_saved_count IS 'Nombre de matchs sauvés via le système "Last".';

-- ------------------------------------------------------------
-- 2.2 MATCHES
-- ------------------------------------------------------------
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_type      TEXT NOT NULL CHECK (match_type IN ('Ranked', 'Amical')),
  is_last_urgent  BOOLEAN DEFAULT FALSE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Full', 'Completed', 'Cancelled')),
  score_team_1    TEXT,  -- Ex: "6-4 / 6-3"
  score_team_2    TEXT,
  location_match  GEOGRAPHY(Point, 4326),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE matches IS 'Matchs de padel (Ranked ou Amical).';

-- ------------------------------------------------------------
-- 2.3 MATCH PARTICIPATIONS
-- ------------------------------------------------------------
CREATE TABLE match_participations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team            INT NOT NULL CHECK (team IN (1, 2)),
  joined_via_last BOOLEAN DEFAULT FALSE,
  UNIQUE (match_id, player_id)  -- Un joueur ne peut rejoindre un match qu'une fois
);

COMMENT ON TABLE match_participations IS 'Inscription des joueurs aux matchs avec équipe assignée.';

-- ------------------------------------------------------------
-- 2.4 REVIEWS (système anti-toxique)
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  punctuality_score INT NOT NULL CHECK (punctuality_score BETWEEN 1 AND 5),
  behavior_score    INT NOT NULL CHECK (behavior_score BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, reviewer_id, reviewed_id),  -- 1 review par paire par match
  CHECK (reviewer_id <> reviewed_id)             -- On ne se note pas soi-même
);

COMMENT ON TABLE reviews IS 'Évaluations post-match. Visibilité retardée (anti-vengeance).';

-- Index utiles
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);
CREATE INDEX idx_match_participations_match ON match_participations(match_id);
CREATE INDEX idx_match_participations_player ON match_participations(player_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_matches_location ON matches USING GIST(location_match);

-- ************************************************************
-- 3. FONCTIONS & TRIGGERS
-- ************************************************************

-- ------------------------------------------------------------
-- 3.1 CALCUL ELO — Déclenché quand status → 'Completed'
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_elo_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_elo_t1  FLOAT;
  v_avg_elo_t2  FLOAT;
  v_expected_t1 FLOAT;
  v_expected_t2 FLOAT;
  v_k           INT := 32;
  v_score_t1    FLOAT;  -- 1.0 = victoire, 0.0 = défaite
  v_delta_t1    FLOAT;
  v_delta_t2    FLOAT;
  rec           RECORD;
BEGIN
  -- Ne s'exécute que pour les matchs Ranked passant à 'Completed'
  IF NEW.match_type <> 'Ranked' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'Completed' OR NEW.status <> 'Completed' THEN
    RETURN NEW;
  END IF;

  -- Moyenne Elo par équipe
  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t1
  FROM match_participations mp
  JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = NEW.id AND mp.team = 1;

  SELECT COALESCE(AVG(p.elo_rating), 1000) INTO v_avg_elo_t2
  FROM match_participations mp
  JOIN profiles p ON p.id = mp.player_id
  WHERE mp.match_id = NEW.id AND mp.team = 2;

  -- Espérance de gain  E1 = 1 / (1 + 10^((Elo_T2 - Elo_T1) / 400))
  v_expected_t1 := 1.0 / (1.0 + POWER(10.0, (v_avg_elo_t2 - v_avg_elo_t1) / 400.0));
  v_expected_t2 := 1.0 - v_expected_t1;

  -- Déterminer le vainqueur via les scores texte (team 1 gagne si score_team_1 > score_team_2)
  -- Comparaison simple : on compte le nombre de sets gagnés
  v_score_t1 := CASE
    WHEN NEW.score_team_1 IS NULL OR NEW.score_team_2 IS NULL THEN 0.5  -- match nul par défaut
    WHEN NEW.score_team_1 > NEW.score_team_2 THEN 1.0
    WHEN NEW.score_team_1 < NEW.score_team_2 THEN 0.0
    ELSE 0.5
  END;

  -- Deltas Elo
  v_delta_t1 := v_k * (v_score_t1 - v_expected_t1);
  v_delta_t2 := v_k * ((1.0 - v_score_t1) - v_expected_t2);

  -- Mise à jour Elo individuelle
  UPDATE profiles
  SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t1)::INT)
  WHERE id IN (
    SELECT player_id FROM match_participations
    WHERE match_id = NEW.id AND team = 1
  );

  UPDATE profiles
  SET elo_rating = GREATEST(0, elo_rating + ROUND(v_delta_t2)::INT)
  WHERE id IN (
    SELECT player_id FROM match_participations
    WHERE match_id = NEW.id AND team = 2
  );

  -- Incrémentation matches_saved_count pour les joueurs "Last"
  IF NEW.is_last_urgent = TRUE THEN
    UPDATE profiles
    SET matches_saved_count = matches_saved_count + 1
    WHERE id IN (
      SELECT player_id FROM match_participations
      WHERE match_id = NEW.id AND joined_via_last = TRUE
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_elo
  BEFORE UPDATE ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'Completed' AND OLD.status IS DISTINCT FROM 'Completed')
  EXECUTE FUNCTION calculate_elo_match();

-- ------------------------------------------------------------
-- 3.2 VUE SÉCURISÉE — revealed_reviews (anti-vengeance)
-- ------------------------------------------------------------
-- Affiche les reviews SEULEMENT si :
--   a) 24h se sont écoulées depuis la fin du match, OU
--   b) Tous les participants du match ont soumis leurs évaluations.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW revealed_reviews AS
SELECT r.*
FROM reviews r
JOIN matches m ON m.id = r.match_id
WHERE
  -- Condition A : 24h écoulées
  m.scheduled_at <= NOW() - INTERVAL '24 hours'
  OR
  -- Condition B : tous les joueurs du match ont évalué
  (
    SELECT COUNT(DISTINCT reviewer_id)
    FROM reviews r2
    WHERE r2.match_id = r.match_id
  ) >= (
    SELECT COUNT(*)
    FROM match_participations mp
    WHERE mp.match_id = r.match_id
  );

COMMENT ON VIEW revealed_reviews IS 'Reviews visibles uniquement après 24h ou quand tous les joueurs ont noté (anti-vengeance).';

-- ------------------------------------------------------------
-- 3.3 MISE À JOUR DU FAIR PLAY SCORE
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_fair_play_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_score FLOAT;
BEGIN
  -- Calculer la moyenne des scores reçus (behavior_score sur 5 → ramené à 100)
  SELECT AVG((punctuality_score + behavior_score) / 2.0) * 20.0
  INTO v_avg_score
  FROM reviews
  WHERE reviewed_id = NEW.reviewed_id;

  IF v_avg_score IS NOT NULL THEN
    UPDATE profiles
    SET fair_play_score = LEAST(100, GREATEST(0, ROUND(v_avg_score)::INT))
    WHERE id = NEW.reviewed_id;
  END IF;

  -- Mise à jour du punctuality_rate
  UPDATE profiles
  SET punctuality_rate = LEAST(100, GREATEST(0, (
    SELECT ROUND(AVG(punctuality_score) * 20.0)::INT
    FROM reviews
    WHERE reviewed_id = NEW.reviewed_id
  )))
  WHERE id = NEW.reviewed_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_fair_play
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_fair_play_score();

-- ------------------------------------------------------------
-- 3.4 BLOCAGE RANKED/LAST POUR JOUEURS FAIR PLAY < 70
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_fair_play_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fp_score    INT;
  v_match_type  TEXT;
  v_is_last     BOOLEAN;
BEGIN
  -- Récupérer le fair_play_score du joueur
  SELECT fair_play_score INTO v_fp_score
  FROM profiles
  WHERE id = NEW.player_id;

  -- Récupérer le type de match et le flag "Last"
  SELECT match_type, is_last_urgent INTO v_match_type, v_is_last
  FROM matches
  WHERE id = NEW.match_id;

  -- Bloquer si fair_play < 70 ET match Ranked ou Last urgent
  IF v_fp_score < 70 AND (v_match_type = 'Ranked' OR v_is_last = TRUE) THEN
    RAISE EXCEPTION
      'Joueur % bloqué : fair_play_score (%) inférieur à 70. Accès Ranked/Last refusé.',
      NEW.player_id, v_fp_score;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_fair_play
  BEFORE INSERT ON match_participations
  FOR EACH ROW
  EXECUTE FUNCTION check_fair_play_eligibility();

-- ************************************************************
-- 4. FONCTIONS UTILITAIRES
-- ************************************************************

-- ------------------------------------------------------------
-- 4.1 Recherche de matchs dans un rayon (km)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION find_matches_within_radius(
  p_user_id UUID,
  p_radius_km INT DEFAULT NULL
)
RETURNS SETOF matches
LANGUAGE plpgsql
STABLE
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
    SELECT m.*
    FROM matches m
    WHERE m.status IN ('Pending', 'Full')
      AND m.scheduled_at > NOW()
      AND m.location_match IS NOT NULL
      AND ST_DWithin(m.location_match, v_location, v_radius * 1000)
    ORDER BY m.scheduled_at ASC;
END;
$$;

-- ------------------------------------------------------------
-- 4.2 Recherche de matchs "Last" urgents à proximité
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION find_last_urgent_matches(
  p_user_id UUID
)
RETURNS SETOF matches
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_location  GEOGRAPHY;
  v_radius    INT;
BEGIN
  SELECT location, max_radius_km INTO v_location, v_radius
  FROM profiles WHERE id = p_user_id;

  v_radius := COALESCE(v_radius, 50);

  RETURN QUERY
    SELECT m.*
    FROM matches m
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

-- ************************************************************
-- 5. ROW LEVEL SECURITY (RLS) — Prêt pour Supabase
-- ************************************************************

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique, modification par le propriétaire
CREATE POLICY "Profiles: lecture publique"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Profiles: modification par propriétaire"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Matches : lecture publique, création par authentifié
CREATE POLICY "Matches: lecture publique"
  ON matches FOR SELECT USING (true);

CREATE POLICY "Matches: création par authentifié"
  ON matches FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Matches: modification par créateur"
  ON matches FOR UPDATE USING (auth.uid() = creator_id);

-- Participations : lecture publique, insertion par le joueur
CREATE POLICY "Participations: lecture publique"
  ON match_participations FOR SELECT USING (true);

CREATE POLICY "Participations: inscription par le joueur"
  ON match_participations FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Reviews : insertion par le reviewer, lecture via la vue revealed_reviews
CREATE POLICY "Reviews: soumission par le reviewer"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviews: lecture propre"
  ON reviews FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id);

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
