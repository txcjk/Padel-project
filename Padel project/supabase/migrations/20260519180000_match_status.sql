-- ============================================================
-- MIGRATION 19: Statut de participation aux matchs et composition d'équipes
-- ============================================================

-- 1. Ajouter la colonne 'status' à match_participations si elle n'existe pas
ALTER TABLE public.match_participations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_confirmation', 'declined'));

-- 2. Mise à jour des politiques RLS de match_participations pour autoriser le créateur du match à inscrire d'autres joueurs
-- Supprimer l'ancienne politique restrictive d'insertion
DROP POLICY IF EXISTS "Participations: inscription par le joueur" ON public.match_participations;

-- Créer une politique d'insertion plus flexible (par le joueur lui-même OU par le créateur du match)
CREATE POLICY "Participations: inscription par joueur ou createur" 
  ON public.match_participations 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = player_id 
    OR 
    auth.uid() = (SELECT creator_id FROM public.matches WHERE id = match_id)
  );

-- Politique de mise à jour pour permettre aux joueurs invités de confirmer ou décliner leur statut
DROP POLICY IF EXISTS "Participations: mise a jour par le joueur" ON public.match_participations;
CREATE POLICY "Participations: mise a jour par le joueur" 
  ON public.match_participations 
  FOR UPDATE 
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- Politique de suppression (désinscription) par le joueur lui-même ou le créateur du match
DROP POLICY IF EXISTS "Participations: suppression par joueur ou createur" ON public.match_participations;
CREATE POLICY "Participations: suppression par joueur ou createur" 
  ON public.match_participations 
  FOR DELETE 
  USING (
    auth.uid() = player_id 
    OR 
    auth.uid() = (SELECT creator_id FROM public.matches WHERE id = match_id)
  );
