-- ============================================================
-- MIGRATION 17: Création des tables manquantes pour la Messagerie, les Réservations et les Tournois
-- ============================================================

-- 1. Table des Messages de Chat (Private Messages & Match Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  sender_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  match_id    UUID REFERENCES public.matches(id) ON DELETE CASCADE -- Support pour les discussions de matches
);

-- Ajouter les colonnes requises si elles n'existent pas
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE;

-- 2. Table des Réservations (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name         TEXT NOT NULL,
  court             TEXT NOT NULL DEFAULT 'Court Central',
  date_time         TIMESTAMPTZ NOT NULL,
  duration_minutes  INT DEFAULT 90
);

-- Ajouter les colonnes requises si elles n'existent pas
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS court TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS date_time TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 90;

-- 3. Table des Tournois (Tournaments)
CREATE TABLE IF NOT EXISTS public.tournaments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  title       TEXT NOT NULL,
  club_name   TEXT NOT NULL,
  start_date  TIMESTAMPTZ,
  max_teams   INT DEFAULT 16,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'finished', 'Upcoming', 'Ongoing', 'Completed'))
);

-- Ajouter les colonnes requises si elles n'existent pas
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS max_teams INT DEFAULT 16;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- 4. Table des inscriptions aux tournois (Tournament Registrations) pour le fonctionnement de la vue
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_1_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, player_1_id)
);

-- 5. Table des points de tournois (Tournament Points) pour le fonctionnement du classement spécifique
CREATE TABLE IF NOT EXISTS public.tournament_points (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points        INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, player_id)
);

-- 6. Activation RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_points ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
DROP POLICY IF EXISTS "Public select on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owner insert/delete on bookings" ON public.bookings;
CREATE POLICY "Public select on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Owner insert/delete on bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public select on messages" ON public.messages;
DROP POLICY IF EXISTS "Owner insert on messages" ON public.messages;
CREATE POLICY "Public select on messages" ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR receiver_id = auth.uid() OR match_id IN (
    SELECT match_id FROM public.match_participations WHERE player_id = auth.uid()
  ));
CREATE POLICY "Owner insert on messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Public select on tournaments" ON public.tournaments;
CREATE POLICY "Public select on tournaments" ON public.tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public select on registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Owner insert/delete on registrations" ON public.tournament_registrations;
CREATE POLICY "Public select on registrations" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Owner insert/delete on registrations" ON public.tournament_registrations FOR ALL USING (auth.uid() = player_1_id);

DROP POLICY IF EXISTS "Public select on points" ON public.tournament_points;
CREATE POLICY "Public select on points" ON public.tournament_points FOR SELECT USING (true);

-- 7. Publication en temps réel (Supabase Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 8. Seed initial de tournois pour enrichir l'application en mode connecté
INSERT INTO public.tournaments (title, club_name, start_date, status) VALUES
('Bordeaux Master Cup', '4Padels Bordeaux', NOW() + INTERVAL '5 days', 'open'),
('Grand Slam Padel Arena', 'Padel Arena Rouen', NOW() + INTERVAL '12 days', 'open'),
('Toulouse Padel Open', 'Casa Padel Paris', NOW() - INTERVAL '2 days', 'ongoing')
ON CONFLICT DO NOTHING;
