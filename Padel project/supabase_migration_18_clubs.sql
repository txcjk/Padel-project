-- ============================================================
-- MIGRATION 18: Bibliothèque des Clubs de France et Ajustements Bookings/Messages
-- ============================================================

-- 1. Table des Clubs (La Bibliothèque des Clubs de France)
CREATE TABLE IF NOT EXISTS public.clubs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  name              TEXT NOT NULL,
  address           TEXT,
  city              TEXT NOT NULL,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  software_provider TEXT DEFAULT 'none', -- 'Doinsport', 'Anybuddy', 'GestionSports', 'none'
  external_api_id   TEXT
);

-- Index pour accélérer la recherche par ville
CREATE INDEX IF NOT EXISTS idx_clubs_city ON public.clubs(city);

-- RLS sur les Clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on clubs" ON public.clubs;
CREATE POLICY "Public select on clubs" ON public.clubs FOR SELECT USING (true);

-- 2. Ajustements sur la Table des Réservations (Bookings)
-- S'assurer que bookings existe
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name         TEXT,
  court             TEXT DEFAULT 'Court Central',
  date_time         TIMESTAMPTZ NOT NULL,
  duration_minutes  INT DEFAULT 90
);

-- Ajouter club_id s'il n'existe pas
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
-- Ajouter status s'il n'existe pas
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- Mettre à jour les politiques RLS pour Bookings
DROP POLICY IF EXISTS "Public select on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Owner insert/delete on bookings" ON public.bookings;
CREATE POLICY "Public select on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Owner insert/delete on bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);

-- 3. Sécurité & Consolidation Messages (Avec Jointures PostgREST)
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  sender_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  match_id    UUID REFERENCES public.matches(id) ON DELETE CASCADE
);

-- Garantir la structure de la table messages et la compatibilité des jointures profils
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;

-- Forcer les clés étrangères sur public.profiles pour l'API PostgREST
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on messages" ON public.messages;
DROP POLICY IF EXISTS "Owner insert on messages" ON public.messages;
CREATE POLICY "Public select on messages" ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR receiver_id = auth.uid() OR match_id IN (
    SELECT match_id FROM public.match_participations WHERE player_id = auth.uid()
  ));
CREATE POLICY "Owner insert on messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Publication en temps réel (Supabase Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 4. Seed initial de la Bibliothèque des Clubs de France
INSERT INTO public.clubs (id, name, address, city, latitude, longitude, software_provider, external_api_id) VALUES
('b0467c6c-829d-4340-9a2d-114eb307421f', '4PADEL Bordeaux', '9 Rue de la Cabane, 33300 Bordeaux', 'Bordeaux', 44.8722, -0.5631, 'Doinsport', 'doi-bx-4p'),
('c537d921-2092-491c-b715-e2d93e11a37c', 'Big Padel Jet Sports', '10 Rue de la Verrerie, 33000 Bordeaux', 'Bordeaux', 44.8614, -0.5512, 'Anybuddy', 'any-bx-bp'),
('a7d8e9f1-3321-4d1a-8219-fc8a0112bf88', 'Padel Touch Arcachon', 'Avenue de l''Europe, 33260 La Teste-de-Buch', 'Arcachon', 44.5982, -1.1394, 'GestionSports', 'gs-arc-pt'),
('e1c8d2a3-9821-4fb1-ac19-d8e23f009cb2', 'Padel Arena Rouen', 'Route de Lyon, 76000 Rouen', 'Rouen', 49.4295, 1.1098, 'Doinsport', 'doi-rou-pa'),
('d4e5f6a7-0091-4bc1-aa11-1a2b3c4d5e6f', 'Casa Padel Paris', '103 Rue Charles Michels, 93200 Saint-Denis', 'Paris', 48.9244, 2.3489, 'Anybuddy', 'any-par-cp')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  software_provider = EXCLUDED.software_provider,
  external_api_id = EXCLUDED.external_api_id;
