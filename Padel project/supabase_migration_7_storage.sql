-- ============================================================
-- MIGRATION SCRIPT 7: Configuration du Bucket Storage Avatars
-- ============================================================

-- 1. Création du bucket 'avatars' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Activation de la sécurité RLS sur storage.objects (déjà actif par défaut dans Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Suppression des anciennes politiques si existantes pour éviter les doublons
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload for Authenticated Users to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update for Authenticated Users to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete for Authenticated Users to their own folder" ON storage.objects;

-- 4. Politique d'accès public : Tout le monde peut lire les photos de profil
CREATE POLICY "Public Access to Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 5. Politique d'upload : Les joueurs authentifiés peuvent uploader dans leur propre dossier
CREATE POLICY "Allow Upload for Authenticated Users to their own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Politique de mise à jour : Les joueurs authentifiés peuvent mettre à jour leurs propres fichiers
CREATE POLICY "Allow Update for Authenticated Users to their own folder" ON storage.objects
  FOR UPDATE TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Politique de suppression : Les joueurs authentifiés peuvent supprimer leurs propres fichiers
CREATE POLICY "Allow Delete for Authenticated Users to their own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
