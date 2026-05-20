-- ============================================================
-- MIGRATION: Secure Admin RPC functions with role checks
-- ============================================================

-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Set initial admin user (based on existing app logic — ludow3b@gmail.com)
UPDATE public.profiles p
SET is_admin = true
FROM auth.users au
WHERE au.id = p.id
  AND au.email = 'ludow3b@gmail.com';

-- 3. Helper: check if current user is admin
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_is_admin, false);
END;
$$;

GRANT EXECUTE ON FUNCTION check_is_admin() TO authenticated;

-- 4. Secure admin_get_all_users with admin role check
DROP FUNCTION IF EXISTS admin_get_all_users();
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  player_tag TEXT,
  email TEXT,
  is_elite BOOLEAN,
  elo_rating INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : droits administrateur requis';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.player_tag,
    au.email::TEXT,
    p.is_elite,
    p.elo_rating
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.elo_rating DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;

-- 5. Secure admin_toggle_elite with admin role check
DROP FUNCTION IF EXISTS admin_toggle_elite(UUID, BOOLEAN);
CREATE OR REPLACE FUNCTION admin_toggle_elite(
  p_user_id UUID,
  p_is_elite BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT check_is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Accès refusé : droits administrateur requis'
    );
  END IF;

  UPDATE public.profiles
  SET is_elite = p_is_elite
  WHERE id = p_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'is_elite', p_is_elite
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_toggle_elite(UUID, BOOLEAN) TO authenticated;
