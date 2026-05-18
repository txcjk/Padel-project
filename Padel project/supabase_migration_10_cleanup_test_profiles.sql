-- ============================================================
-- ELOMATCH — Nettoyage des profils et utilisateurs de test
-- ============================================================
-- Ce script supprime de manière sécurisée tous les comptes de test.
-- La suppression dans auth.users cascade automatiquement dans la table public.profiles
-- ainsi que toutes les tables liées (participations, matches, reviews).
-- ============================================================

DELETE FROM auth.users
WHERE (
  -- Critère A : L'email contient 'test', 'demo' ou 'example'
  email ILIKE '%test%'
  OR email ILIKE '%demo%'
  OR email ILIKE '%example%'
  
  -- Critère B : Le profil associé contient 'test' ou 'demo' dans le prénom/nom
  OR id IN (
    SELECT id FROM public.profiles
    WHERE first_name ILIKE '%test%'
       OR last_name ILIKE '%test%'
       OR first_name ILIKE '%demo%'
       OR last_name ILIKE '%demo%'
  )
)
-- SÉCURITÉ : Ne jamais supprimer le compte officiel du créateur
AND email <> 'ludow3b@gmail.com';
