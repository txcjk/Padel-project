-- ============================================================
-- MIGRATION: Admin RPC for creating user accounts
-- ============================================================
-- Permet aux admins de créer des comptes utilisateur directement
-- sans passer par le formulaire public d'inscription.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_city TEXT DEFAULT '',
  p_club TEXT DEFAULT '',
  p_elo INT DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT check_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé : droits administrateur requis');
  END IF;

  -- Vérifier si l'email existe déjà
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = p_email) INTO v_exists;
  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Un compte avec cet email existe déjà');
  END IF;

  -- Créer le user dans auth.users
  v_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_sso_user, is_anonymous, confirmation_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id,
    'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_first_name || ' ' || p_last_name),
    now(), now(), false, false, ''
  );

  -- Créer l'identité
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id, 'email', p_email), 'email', p_email, now(), now(), now());

  -- Créer/mettre à jour le profil
  INSERT INTO public.profiles (id, first_name, last_name, is_elite, is_admin, is_beta_tester, elo_rating, player_tag, city, club)
  VALUES (v_user_id, p_first_name, p_last_name, false, false, false, p_elo, 
    upper(substr(p_first_name, 1, 1) || substr(p_last_name, 1, 1)) || '#' || floor(random() * 9000 + 1000)::text,
    p_city, p_club)
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    elo_rating = EXCLUDED.elo_rating,
    player_tag = EXCLUDED.player_tag;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'player_tag', upper(substr(p_first_name, 1, 1) || substr(p_last_name, 1, 1)) || '#' || floor(random() * 9000 + 1000)::text
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;
