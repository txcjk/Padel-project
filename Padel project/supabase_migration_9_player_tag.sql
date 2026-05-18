-- ============================================================
-- MIGRATION SCRIPT 9: Ajout de l'Identifiant unique Player Tag
-- ============================================================

-- 1. Ajout de la colonne player_tag à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS player_tag TEXT UNIQUE;

COMMENT ON COLUMN public.profiles.player_tag IS 'Identifiant unique de jeu sous la forme Prénom#XXXX';

-- 2. Génération automatique rétroactive pour les profils existants
DO $$
DECLARE
  rec RECORD;
  v_tag TEXT;
  v_exists BOOLEAN;
  v_rand INT;
  v_first_name TEXT;
BEGIN
  FOR rec IN SELECT id, first_name FROM public.profiles WHERE player_tag IS NULL LOOP
    v_first_name := COALESCE(NULLIF(TRIM(rec.first_name), ''), 'Player');
    LOOP
      v_rand := floor(random() * 9000 + 1000)::INT; -- Génère un nombre entre 1000 et 9999
      v_tag := v_first_name || '#' || v_rand::TEXT;
      
      -- Vérification d'unicité
      SELECT EXISTS (SELECT 1 FROM public.profiles WHERE player_tag = v_tag) INTO v_exists;
      IF NOT v_exists THEN
        UPDATE public.profiles SET player_tag = v_tag WHERE id = rec.id;
        EXIT; -- Sorte de la boucle si unique
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
