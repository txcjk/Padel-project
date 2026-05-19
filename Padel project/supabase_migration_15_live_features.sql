-- ==============================================================================
-- Migration 15 : Tables et politiques de sécurité pour les 4 fonctions Live
-- ==============================================================================

-- 1. Table des Réservations (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club        TEXT NOT NULL,
  court       TEXT NOT NULL,
  booked_at   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (club, court, booked_at)
);

-- 2. Table des Messages de Chat (In-App Messaging)
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id      UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  recipient_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_message_target CHECK (
    (match_id IS NOT NULL AND recipient_id IS NULL) OR
    (match_id IS NULL AND recipient_id IS NOT NULL)
  )
);

-- 3. Tables des Tournois (Tournaments)
CREATE TABLE IF NOT EXISTS public.tournaments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  club          TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        TEXT CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')) DEFAULT 'Upcoming',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_1_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_name TEXT, -- Fallback si le partenaire n'est pas inscrit sur l'application
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, player_1_id)
);

CREATE TABLE IF NOT EXISTS public.tournament_points (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points        INT NOT NULL DEFAULT 0,
  UNIQUE (tournament_id, player_id)
);

-- 4. Activation RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_points ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
CREATE POLICY "Public select on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Owner insert/delete on bookings" ON public.bookings 
  FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Public select on messages" ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR recipient_id = auth.uid() OR match_id IN (
    SELECT match_id FROM public.match_participations WHERE player_id = auth.uid()
  ));
CREATE POLICY "Owner insert on messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Public select on tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public select on registrations" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Owner insert/delete on registrations" ON public.tournament_registrations
  FOR ALL USING (auth.uid() = player_1_id);
CREATE POLICY "Public select on points" ON public.tournament_points FOR SELECT USING (true);

-- 5. Publication en temps réel (Supabase Realtime)
-- Note : pour éviter une erreur si elle existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 6. Seed initial pour donner de la vie (optionnel si importé à la main, mais utile en base locale)
INSERT INTO public.tournaments (title, club, scheduled_at, status) VALUES
('Bordeaux Master Cup', '4Padels Bordeaux', NOW() + INTERVAL '5 days', 'Upcoming'),
('Grand Slam Padel Arena', 'Padel Arena Rouen', NOW() + INTERVAL '12 days', 'Upcoming'),
('Toulouse Padel Open', 'Casa Padel Paris', NOW() - INTERVAL '2 days', 'Ongoing')
ON CONFLICT DO NOTHING;
