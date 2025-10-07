-- Debug query om te controleren wat er in de database staat
-- Voer dit uit in Supabase SQL Editor

-- 1. Controleer of er sessies zijn voor de demo gebruiker
SELECT 
  cs.id,
  cs.user_id,
  cs.started_at,
  cs.ended_at,
  cs.rating,
  cs.recipe_snapshot->>'title' as recipe_title
FROM cook_sessions cs
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
ORDER BY cs.started_at DESC;

-- 2. Controleer alle gebruikers in de auth.users tabel
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'demo@stook.nl'
ORDER BY created_at DESC;

-- 3. Controleer of er een profiel is voor de demo gebruiker
SELECT 
  id,
  display_name,
  created_at
FROM profiles
WHERE id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid;

-- 4. Controleer alle sessies (ongeacht gebruiker)
SELECT 
  cs.id,
  cs.user_id,
  cs.started_at,
  cs.ended_at,
  cs.rating,
  cs.recipe_snapshot->>'title' as recipe_title
FROM cook_sessions cs
ORDER BY cs.started_at DESC
LIMIT 10;
