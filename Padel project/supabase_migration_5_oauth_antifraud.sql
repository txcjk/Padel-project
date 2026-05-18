-- ============================================================
-- MIGRATION SCRIPT 5: OAuth Google & Anti-Fraude (Multi-comptes)
-- ============================================================

-- 1. Table d'historique des connexions d'appareils
CREATE TABLE IF NOT EXISTS public.user_devices (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_uuid UUID NOT NULL,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, device_uuid)
);

COMMENT ON TABLE public.user_devices IS 'Associe un utilisateur à un appareil unique pour limiter le multi-compte abusif.';

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs appareils"
  ON public.user_devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent enregistrer leurs appareils"
  ON public.user_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur appareil"
  ON public.user_devices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Fonction de gestion des nouveaux inscrits (Email ou Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name  TEXT;
  v_city       TEXT;
BEGIN
  -- 2.A Blocage strict des emails jetables
  IF NEW.email ~* '@(yopmail\.com|mailinator\.com|tempmail\.com|guerrillamail\.com|10minutemail\.com|sharklasers\.com|dropmail\.me)$' THEN
    RAISE EXCEPTION 'Les adresses email temporaires ou jetables ne sont pas autorisées pour préserver l''équité des parties.';
  END IF;

  -- 2.B Création du profil public
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
    'Joueur'
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2),
    'Anonyme'
  );

  v_city := COALESCE(
    NEW.raw_user_meta_data->>'city',
    'Bordeaux'
  );

  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    city, 
    elo_rating, 
    fair_play_score, 
    punctuality_rate, 
    matches_saved_count
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    v_city,
    1000,
    100,
    100,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Mise en place du trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
