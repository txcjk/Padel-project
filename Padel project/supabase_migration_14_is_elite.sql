-- ==============================================================================
-- Migration 14 : Ajout de la colonne is_elite et des fonctions d'administration
-- ==============================================================================

-- 1. Ajout de la colonne au profil public
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_elite BOOLEAN DEFAULT false;

-- 2. Fonction RPC pour récupérer tous les utilisateurs (réservée à l'administrateur)
--    SECURITY DEFINER est nécessaire pour lire auth.users
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  player_tag TEXT,
  email TEXT,
  is_elite BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérification de sécurité stricte : seul l'email admin peut exécuter ceci
  IF (SELECT auth.email() = 'ludow3b@gmail.com') THEN
    RETURN QUERY
    SELECT 
      p.id, 
      p.first_name, 
      p.last_name, 
      p.player_tag, 
      u.email::TEXT, 
      p.is_elite
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;
END;
$$;

-- 3. Fonction RPC pour basculer le statut Élite (réservée à l'administrateur)
CREATE OR REPLACE FUNCTION admin_toggle_elite(p_user_id UUID, p_is_elite BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérification de sécurité stricte
  IF (SELECT auth.email() = 'ludow3b@gmail.com') THEN
    UPDATE public.profiles SET is_elite = p_is_elite WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;
END;
$$;
