-- ============================================================
-- MIGRATION 23: Admin RPC functions for user management
-- ============================================================

-- 1. admin_get_all_users: Returns all profiles with email for admin panel
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

-- 2. admin_toggle_elite: Toggles is_elite status for a user
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
