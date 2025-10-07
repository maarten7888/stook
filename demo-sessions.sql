-- Demo sessies voor demo@stook.nl (eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c)
-- Voer dit script uit in Supabase SQL Editor

-- Eerst zoeken we een paar recepten om sessies voor te maken
-- We nemen de eerste twee recepten uit de database

-- Sessie 1: Texas Style Brisket (voltooid)
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
  'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c',
  '2024-01-15 06:00:00+00',
  '2024-01-15 18:30:00+00',
  'Perfecte sessie! Temperatuur was de hele dag stabiel op 110°C. De brisket had een mooie smoke ring en was super tender. Post oak rook gaf een geweldige smaak.',
  5,
  'Uitstekend resultaat! De brisket was perfect gaar en had een prachtige bark. Smoke ring was perfect zichtbaar. Zeker voor herhaling vatbaar. Familie was er dol op!',
  '{"smoke_ring": "perfect", "bark": "excellent", "tenderness": "perfect", "next_time": "Probeer 2 uur langer te roken voor nog meer smaak"}',
  '{"title": "Texas Style Brisket", "description": "Klassieke Texas brisket met post oak rook. Perfect voor beginners en experts.", "serves": 8, "prepMinutes": 45, "cookMinutes": 720, "targetInternalTemp": 95}'
);

-- Sessie 2: Memphis Style Ribs (actief - nog niet afgerond)
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
  'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c',
  '2024-01-20 14:00:00+00',
  NULL,
  'Ribs zijn net op de BBQ gezet. Dry rub ziet er goed uit. Temperatuur stabiliseert op 120°C. Houtsoort: hickory voor extra smaak.',
  NULL,
  NULL,
  NULL,
  '{"title": "Memphis Style Ribs", "description": "Dry rub ribs Memphis-style. Geen saus, alleen perfecte kruiden.", "serves": 4, "prepMinutes": 30, "cookMinutes": 360, "targetInternalTemp": 88}'
);

-- Temperatuurmetingen voor Sessie 1 (Texas Style Brisket)
INSERT INTO session_temps (id, cook_session_id, recorded_at, grate_temp, meat_temp, probe_name) VALUES
('t1a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 06:15:00+00', 110, 25, 'Probe 1'),
('t2a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 06:30:00+00', 112, 28, 'Probe 1'),
('t3a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 06:45:00+00', 108, 32, 'Probe 1'),
('t4a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 07:00:00+00', 109, 35, 'Probe 1'),
('t5a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 07:15:00+00', 111, 38, 'Probe 1'),
('t6a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 07:30:00+00', 110, 42, 'Probe 1'),
('t7a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 07:45:00+00', 109, 45, 'Probe 1'),
('t8a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 08:00:00+00', 112, 48, 'Probe 1'),
('t9a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 08:15:00+00', 110, 52, 'Probe 1'),
('t10a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 08:30:00+00', 111, 55, 'Probe 1'),
('t11a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 08:45:00+00', 109, 58, 'Probe 1'),
('t12a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 09:00:00+00', 110, 62, 'Probe 1'),
('t13a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 09:15:00+00', 112, 65, 'Probe 1'),
('t14a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 09:30:00+00', 111, 68, 'Probe 1'),
('t15a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 09:45:00+00', 110, 72, 'Probe 1'),
('t16a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 10:00:00+00', 109, 75, 'Probe 1'),
('t17a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 10:15:00+00', 111, 78, 'Probe 1'),
('t18a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 10:30:00+00', 110, 82, 'Probe 1'),
('t19a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 10:45:00+00', 112, 85, 'Probe 1'),
('t20a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 11:00:00+00', 111, 88, 'Probe 1'),
('t21a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 11:15:00+00', 110, 92, 'Probe 1'),
('t22a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 11:30:00+00', 109, 95, 'Probe 1'),
('t23a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 11:45:00+00', 111, 95, 'Probe 1'),
('t24a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-01-15 12:00:00+00', 110, 95, 'Probe 1');

-- Temperatuurmetingen voor Sessie 2 (Memphis Style Ribs - actief)
INSERT INTO session_temps (id, cook_session_id, recorded_at, grate_temp, meat_temp, probe_name) VALUES
('t1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 14:15:00+00', 120, 22, 'Probe 1'),
('t2b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 14:30:00+00', 118, 25, 'Probe 1'),
('t3b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 14:45:00+00', 119, 28, 'Probe 1'),
('t4b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 15:00:00+00', 121, 32, 'Probe 1'),
('t5b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 15:15:00+00', 120, 35, 'Probe 1'),
('t6b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 15:30:00+00', 119, 38, 'Probe 1'),
('t7b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 15:45:00+00', 122, 42, 'Probe 1'),
('t8b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 16:00:00+00', 120, 45, 'Probe 1'),
('t9b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 16:15:00+00', 121, 48, 'Probe 1'),
('t10b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 16:30:00+00', 119, 52, 'Probe 1'),
('t11b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 16:45:00+00', 120, 55, 'Probe 1'),
('t12b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 17:00:00+00', 118, 58, 'Probe 1'),
('t13b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 17:15:00+00', 121, 62, 'Probe 1'),
('t14b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 17:30:00+00', 120, 65, 'Probe 1'),
('t15b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 17:45:00+00', 119, 68, 'Probe 1'),
('t16b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 18:00:00+00', 122, 72, 'Probe 1'),
('t17b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 18:15:00+00', 120, 75, 'Probe 1'),
('t18b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 18:30:00+00', 121, 78, 'Probe 1'),
('t19b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 18:45:00+00', 119, 82, 'Probe 1'),
('t20b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', '2024-01-20 19:00:00+00', 120, 85, 'Probe 1');

-- Demo foto's voor Sessie 1 (Texas Style Brisket)
INSERT INTO photos (id, recipe_id, cook_session_id, path, type, created_at) VALUES
('p1a2b3c4-d5e6-7890-abcd-ef1234567890', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'photos/2024/01/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/brisket-prep.jpg', 'prep', '2024-01-15 05:30:00+00'),
('p2a2b3c4-d5e6-7890-abcd-ef1234567890', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'photos/2024/01/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/brisket-on-grill.jpg', 'session', '2024-01-15 06:00:00+00'),
('p3a2b3c4-d5e6-7890-abcd-ef1234567890', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'photos/2024/01/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/smoke-ring.jpg', 'session', '2024-01-15 10:00:00+00'),
('p4a2b3c4-d5e6-7890-abcd-ef1234567890', NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'photos/2024/01/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/final-brisket.jpg', 'final', '2024-01-15 18:30:00+00');

-- Demo foto's voor Sessie 2 (Memphis Style Ribs)
INSERT INTO photos (id, recipe_id, cook_session_id, path, type, created_at) VALUES
('p1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'photos/2024/01/sessions/b2c3d4e5-f6g7-8901-bcde-f23456789012/ribs-prep.jpg', 'prep', '2024-01-20 13:30:00+00'),
('p2b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'photos/2024/01/sessions/b2c3d4e5-f6g7-8901-bcde-f23456789012/ribs-on-grill.jpg', 'session', '2024-01-20 14:00:00+00'),
('p3b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'photos/2024/01/sessions/b2c3d4e5-f6g7-8901-bcde-f23456789012/ribs-progress.jpg', 'session', '2024-01-20 16:00:00+00');

-- Verificatie query om te controleren of alles correct is ingevoegd
SELECT 
  cs.id,
  cs.started_at,
  cs.ended_at,
  cs.rating,
  r.title as recipe_title,
  COUNT(st.id) as temp_count,
  COUNT(p.id) as photo_count
FROM cook_sessions cs
JOIN recipes r ON cs.recipe_id = r.id
LEFT JOIN session_temps st ON cs.id = st.cook_session_id
LEFT JOIN photos p ON cs.id = p.cook_session_id
WHERE cs.user_id = 'eca5eb65-2fe6-4ee7-b827-2bae3f48ca3c'
GROUP BY cs.id, cs.started_at, cs.ended_at, cs.rating, r.title
ORDER BY cs.started_at DESC;
