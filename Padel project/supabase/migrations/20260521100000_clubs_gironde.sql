-- ============================================================
-- MIGRATION 23: Ajout massif des clubs de padel de Gironde
-- ============================================================
-- Source: recherche web mai 2026 (padelspot, passion-padel, etc.)
-- ============================================================

-- 1. Ajouter les colonnes complémentaires si pas déjà faites
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS indoor_courts INT DEFAULT 1;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS amenities TEXT;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. Injection des 18 nouveaux clubs de Gironde
INSERT INTO public.clubs (id, name, address, city, postal_code, latitude, longitude, indoor_courts, software_provider, external_api_id, phone, website) VALUES

-- 3D Padel - Le Haillan
('a1000001-0001-4000-8000-000000000001', '3D Padel', '9 Rue des Satellites', 'Le Haillan', '33185', 44.8720, -0.6770, 7, 'none', '3d-le-haillan', '05 56 17 64 34', 'https://www.3dpadel.fr'),

-- Buenavista Padel Club - Camblanes-et-Meynac
('a1000001-0002-4000-8000-000000000002', 'Buenavista Padel Club', '6 Allée Adrien Bedin', 'Camblanes-et-Meynac', '33360', 44.7650, -0.4880, 5, 'none', 'buenavista-camblanes', null, 'https://buenavistapadelclub.fr'),

-- CA Béglais Padel - Bègles
('a1000001-0003-4000-8000-000000000003', 'CA Béglais Padel', 'Complexe Delphin Loche, 1 Impasse Delphin Loche', 'Bègles', '33130', 44.8080, -0.5480, 5, 'none', 'ca-beglais', '05 56 49 42 02', 'https://www.cabeglais.fr/sports-activites/padel/'),

-- C'' Padel Club - Virsac
('a1000001-0004-4000-8000-000000000004', 'C'' Padel Club', '200 Route de Saint Antoine', 'Virsac', '33240', 45.0270, -0.4560, 6, 'none', 'cpadel-virsac', '06 22 30 62 90', 'https://www.cpadelclub.fr'),

-- Forever Padel - Canéjan
('a1000001-0005-4000-8000-000000000005', 'Forever Padel', '18 Avenue Ferdinand de Lesseps', 'Canéjan', '33610', 44.7630, -0.6540, 7, 'none', 'forever-canejan', '05 47 74 07 11', 'https://www.foreverpadel.fr'),

-- Ginga Stadium - Mérignac
('a1000001-0006-4000-8000-000000000006', 'Ginga Stadium', '8 Rue Georges Nègrevergne', 'Mérignac', '33700', 44.8420, -0.6460, 2, 'none', 'ginga-merignac', '05 64 31 25 00', 'https://www.ginga-stadium.com'),

-- MB Padel - Sainte-Eulalie
('a1000001-0007-4000-8000-000000000007', 'MB Padel', '18 Rue Claude Bernard', 'Sainte-Eulalie', '33560', 44.9080, -0.4730, 4, 'Doinsport', 'doi-mb-steulalie', '05 56 52 65 20', 'https://www.mbpadel33.fr'),

-- MY PADEL - Ayguemorte-les-Graves
('a1000001-0008-4000-8000-000000000008', 'MY PADEL', 'Allée de l''Agrostis, Rte des Grands Pins', 'Ayguemorte-les-Graves', '33640', 44.6940, -0.4830, 4, 'none', 'mypadel-ayguemorte', '07 88 30 24 95', 'https://mypadel33.com'),

-- Padel House - Cenon
('a1000001-0009-4000-8000-000000000009', 'Padel House', '4 Rue du Professeur Langevin', 'Cenon', '33150', 44.8570, -0.5180, 5, 'none', 'padelhouse-cenon', '07 44 97 54 22', 'https://www.padelhousefrance.net'),

-- Padel 33 - Bordeaux
('a1000001-0010-4000-8000-000000000010', 'Padel 33 - Bordeaux', '23 Rue René Magné', 'Bordeaux', '33300', 44.8700, -0.5480, 6, 'none', 'padel33-bordeaux', '05 56 07 09 96', 'https://padel33.fr'),

-- Padel 33 - Bruges
('a1000001-0011-4000-8000-000000000011', 'Padel 33 - Bruges', '2 Rue de Strasbourg', 'Bruges', '33520', 44.8830, -0.6120, 11, 'none', 'padel33-bruges', '05 54 20 04 60', 'https://padel33.fr'),

-- Padel 33 - Gradignan
('a1000001-0012-4000-8000-000000000012', 'Padel 33 - Gradignan', '10 Allée Carthon Ferrière', 'Gradignan', '33170', 44.7750, -0.6210, 4, 'none', 'padel33-gradignan', '05 56 88 83 70', 'https://padel33.fr'),

-- Padel 33 - Mérignac
('a1000001-0013-4000-8000-000000000013', 'Padel 33 - Mérignac', '25 Avenue Neil Armstrong', 'Mérignac', '33700', 44.8340, -0.6760, 5, 'none', 'padel33-merignac', '05 56 12 01 96', 'https://padel33.fr'),

-- Rocquevielle / Girondins - Mérignac
('a1000001-0014-4000-8000-000000000014', 'Rocquevielle (Girondins)', '107 Avenue Marcel Dassault', 'Mérignac', '33700', 44.8350, -0.6650, 6, 'none', 'rocquevielle-merignac', '05 56 34 41 94', 'https://www.rocquevielle.com'),

-- TC du Pinsan - Eysines
('a1000001-0015-4000-8000-000000000015', 'TC du Pinsan', 'Rue du Pinsan', 'Eysines', '33320', 44.8850, -0.6430, 5, 'none', 'tcpinsan-eysines', '05 56 28 30 12', 'https://www.tc-pinsan.fr'),

-- THE PADEL - Bègles
('a1000001-0016-4000-8000-000000000016', 'THE PADEL', '212 Avenue du Maréchal Leclerc', 'Bègles', '33130', 44.8080, -0.5480, 5, 'none', 'thepadel-begles', null, 'https://thepadel.fr'),

-- UCPA Sport Station - Bordeaux
('a1000001-0017-4000-8000-000000000017', 'UCPA Sport Station Bordeaux', '10 Rue Charles Chaigneau', 'Bordeaux', '33100', 44.8610, -0.5560, 7, 'Anybuddy', 'any-ucpa-bordeaux', null, 'https://www.ucpa.com/sport-station/bordeaux/padel'),

-- Twins Padel Club - Lacanau
('a1000001-0018-4000-8000-000000000018', 'Twins Padel Club', null, 'Lacanau', '33680', 44.9790, -1.0790, 4, 'none', 'twins-lacanau', null, 'https://twinspadel.fr')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  indoor_courts = EXCLUDED.indoor_courts,
  software_provider = EXCLUDED.software_provider,
  external_api_id = EXCLUDED.external_api_id,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website;

-- 3. Mise à jour des clubs existants avec les nouvelles colonnes
UPDATE public.clubs SET
  indoor_courts = 7,
  amenities = '7 terrains indoor, Sport Bar, Parking',
  phone = '05 56 50 20 21',
  website = 'https://www.4padel.fr/nos-centres/2/bordeaux'
WHERE external_api_id = 'doi-bx-4p';

UPDATE public.clubs SET
  indoor_courts = 5,
  amenities = '5 terrains indoor, 2 outdoor, Club House, ProShop, Pétanque',
  phone = '05 54 51 17 11',
  website = 'https://bigpadel.fr'
WHERE external_api_id = 'any-bx-bp';

UPDATE public.clubs SET
  indoor_courts = 5,
  amenities = '5 pistes indoor ultra-panoramiques (Mondo Supercourt XN), Hauteur 10m, Hola Bodega / Restauration, Vestiaires individuels',
  phone = null,
  website = null
WHERE external_api_id = 'hola-padel-smj';

UPDATE public.clubs SET
  indoor_courts = 8,
  phone = null,
  website = 'https://padeltouch.fr'
WHERE external_api_id = 'gs-arc-pt';
