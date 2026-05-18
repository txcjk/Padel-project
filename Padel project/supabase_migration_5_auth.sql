-- ============================================================
-- MIGRATION SCRIPT 5: Auto-create profil sur signup
-- ============================================================
-- Crée automatiquement un profil quand un utilisateur
-- s'inscrit via Google (ou email/password).
-- ============================================================

-- 1. Fonction qui crée un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name', 'Joueur'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name', 'Padel')
  );
  RETURN NEW;
END;
$$;

-- 2. Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Sécuriser la fonction
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
