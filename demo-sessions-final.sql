-- Demo sessies voor demo@stook.nl (eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c)
-- Voer dit script uit in Supabase SQL Editor

-- Eerst verwijderen we eventuele bestaande demo data om dubbelingen te voorkomen
DELETE FROM photos WHERE cook_session_id IN (
  SELECT id FROM cook_sessions WHERE user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
);

DELETE FROM session_temps WHERE cook_session_id IN (
  SELECT id FROM cook_sessions WHERE user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
);

DELETE FROM cook_sessions WHERE user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid;

-- Sessie 1: Texas Style Brisket (voltooid)
WITH session1 AS (
  INSERT INTO cook_sessions (
    id,
    recipe_id,
    user_id,
    started_at,
    ended_at,
    notes,
    rating,
    conclusion,
    adjustments,
    recipe_snapshot
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM recipes WHERE title = 'Texas Style Brisket' LIMIT 1),
    'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid,
    '2024-01-15 06:00:00+00'::timestamp,
    '2024-01-15 18:30:00+00'::timestamp,
    'Perfecte sessie! Temperatuur was de hele dag stabiel op 110°C. De brisket had een mooie smoke ring en was super tender. Post oak rook gaf een geweldige smaak.',
    5,
    'Uitstekend resultaat! De brisket was perfect gaar en had een prachtige bark. Smoke ring was perfect zichtbaar. Zeker voor herhaling vatbaar. Familie was er dol op!',
    '{"smoke_ring": "perfect", "bark": "excellent", "tenderness": "perfect", "next_time": "Probeer 2 uur langer te roken voor nog meer smaak"}',
    '{"title": "Texas Style Brisket", "description": "Klassieke Texas brisket met post oak rook. Perfect voor beginners en experts.", "serves": 8, "prepMinutes": 45, "cookMinutes": 720, "targetInternalTemp": 95}'
  ) RETURNING id
),
session2 AS (
  INSERT INTO cook_sessions (
    id,
    recipe_id,
    user_id,
    started_at,
    ended_at,
    notes,
    rating,
    conclusion,
    adjustments,
    recipe_snapshot
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM recipes WHERE title = 'Memphis Style Ribs' LIMIT 1),
    'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid,
    '2024-01-20 14:00:00+00'::timestamp,
    NULL,
    'Ribs zijn net op de BBQ gezet. Dry rub ziet er goed uit. Temperatuur stabiliseert op 120°C. Houtsoort: hickory voor extra smaak.',
    NULL,
    NULL,
    NULL,
    '{"title": "Memphis Style Ribs", "description": "Dry rub ribs Memphis-style. Geen saus, alleen perfecte kruiden.", "serves": 4, "prepMinutes": 30, "cookMinutes": 360, "targetInternalTemp": 88}'
  ) RETURNING id
)
-- Temperatuurmetingen voor Sessie 1 (Texas Style Brisket)
INSERT INTO session_temps (id, cook_session_id, recorded_at, grate_temp, meat_temp, probe_name)
SELECT 
  gen_random_uuid(),
  s1.id,
  '2024-01-15 06:15:00+00'::timestamp + (interval '15 minutes' * generate_series(0, 23)),
  108 + (random() * 8)::int,
  20 + (generate_series(0, 23) * 3) + (random() * 3)::int,
  'Probe 1'
FROM session1 s1

UNION ALL

-- Temperatuurmetingen voor Sessie 2 (Memphis Style Ribs)
SELECT 
  gen_random_uuid(),
  s2.id,
  '2024-01-20 14:15:00+00'::timestamp + (interval '15 minutes' * generate_series(0, 19)),
  118 + (random() * 6)::int,
  20 + (generate_series(0, 19) * 3) + (random() * 3)::int,
  'Probe 1'
FROM session2 s2;

-- Foto's voor Sessie 1 (Texas Style Brisket)
INSERT INTO photos (id, recipe_id, cook_session_id, path, type, created_at)
SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/brisket-prep.jpg',
  'prep',
  '2024-01-15 05:30:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Texas Style Brisket'

UNION ALL

SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/brisket-on-grill.jpg',
  'session',
  '2024-01-15 06:00:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Texas Style Brisket'

UNION ALL

SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/smoke-ring.jpg',
  'session',
  '2024-01-15 10:00:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Texas Style Brisket'

UNION ALL

SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/final-brisket.jpg',
  'final',
  '2024-01-15 18:30:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Texas Style Brisket'

UNION ALL

-- Foto's voor Sessie 2 (Memphis Style Ribs)
SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/ribs-prep.jpg',
  'prep',
  '2024-01-20 13:30:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Memphis Style Ribs'

UNION ALL

SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/ribs-on-grill.jpg',
  'session',
  '2024-01-20 14:00:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Memphis Style Ribs'

UNION ALL

SELECT 
  gen_random_uuid(),
  NULL::uuid,
  cs.id,
  'photos/2024/01/sessions/' || cs.id || '/ribs-progress.jpg',
  'session',
  '2024-01-20 16:00:00+00'::timestamp
FROM cook_sessions cs 
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
  AND cs.recipe_snapshot->>'title' = 'Memphis Style Ribs';

-- Verificatie query om te controleren of alles correct is ingevoegd
SELECT 
  cs.id,
  cs.started_at,
  cs.ended_at,
  cs.rating,
  cs.recipe_snapshot->>'title' as recipe_title,
  COUNT(st.id) as temp_count,
  COUNT(p.id) as photo_count
FROM cook_sessions cs
LEFT JOIN session_temps st ON cs.id = st.cook_session_id
LEFT JOIN photos p ON cs.id = p.cook_session_id
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'::uuid
GROUP BY cs.id, cs.started_at, cs.ended_at, cs.rating, cs.recipe_snapshot->>'title'
ORDER BY cs.started_at DESC;
