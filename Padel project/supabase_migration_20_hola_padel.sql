-- ============================================================
-- MIGRATION 20: Intégration de ¡HOLA! PADEL (Saint-Médard-en-Jalles)
-- ============================================================

-- 1. Ajouter les colonnes complémentaires à la table des Clubs s'il y a lieu
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS indoor_courts INT DEFAULT 1;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS amenities TEXT;

-- 2. Injection officielle du club ¡HOLA! PADEL
INSERT INTO public.clubs (
  id, 
  name, 
  address, 
  city, 
  postal_code, 
  indoor_courts, 
  amenities, 
  latitude, 
  longitude, 
  software_provider, 
  external_api_id
) VALUES (
  'f2c8d3a4-9821-4fb1-ac19-d8e23f009cb3',
  '¡HOLA! PADEL',
  '15 avenue de Berlincan',
  'Saint-Médard-en-Jalles',
  '33160',
  5,
  '5 pistes indoor ultra-panoramiques (Mondo Supercourt XN), Hauteur 10m, Hola Bodega / Restauration, Vestiaires individuels',
  44.8964,
  -0.7208,
  'none',
  'hola-padel-smj'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  indoor_courts = EXCLUDED.indoor_courts,
  amenities = EXCLUDED.amenities,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  software_provider = EXCLUDED.software_provider,
  external_api_id = EXCLUDED.external_api_id;
