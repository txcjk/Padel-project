-- ============================================================
-- MIGRATION SCRIPT 6: Ajout Avatar & Fiche FIFA
-- ============================================================

-- 1. Ajout de la colonne avatar_url
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de la photo de profil (généralement synchronisée depuis Google OAuth).';

-- 2. Mise à jour de la fonction handle_new_user pour extraire l'avatar
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
  v_avatar     TEXT;
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

  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    city, 
    avatar_url,
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
    v_avatar,
    1000,
    100,
    100,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
