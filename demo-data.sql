-- Demo data voor Stook BBQ App
-- Voer dit script uit in Supabase SQL Editor

-- Cleanup bestaande demo data (idempotent)
DELETE FROM reviews WHERE user_id IN (
  SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
);
DELETE FROM session_temps WHERE cook_session_id IN (
  SELECT id FROM cook_sessions WHERE user_id IN (
    SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
  )
);
DELETE FROM photos WHERE recipe_id IN (
  SELECT id FROM recipes WHERE user_id IN (
    SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
  )
);
DELETE FROM steps WHERE recipe_id IN (
  SELECT id FROM recipes WHERE user_id IN (
    SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
  )
);
DELETE FROM recipe_ingredients WHERE recipe_id IN (
  SELECT id FROM recipes WHERE user_id IN (
    SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
  )
);
DELETE FROM cook_sessions WHERE user_id IN (
  SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
);
DELETE FROM recipe_tags WHERE recipe_id IN (
  SELECT id FROM recipes WHERE user_id IN (
    SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
  )
);
DELETE FROM recipes WHERE user_id IN (
  SELECT id FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%'
);
DELETE FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%';

-- Demo gebruikers (profiles)
INSERT INTO profiles (id, display_name, favorite_meat, bbq_style, experience_level, favorite_wood, bio, location, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Maarten BBQ', 'Brisket', 'Texas Style', 'Expert', 'Post Oak', 'Passionate pitmaster uit Amsterdam. Gespecialiseerd in Texas BBQ en low & slow.', 'Amsterdam, NL', null),
('22222222-2222-2222-2222-222222222222', 'Sarah''s Smokehouse', 'Ribs', 'Memphis Style', 'Advanced', 'Hickory', 'BBQ enthusiast met focus op ribs en pulled pork. Liefhebber van Memphis-style.', 'Rotterdam, NL', null),
('33333333-3333-3333-3333-333333333333', 'Kamado King', 'Chicken', 'Grilling', 'Intermediate', 'Cherry', 'Kamado specialist. Perfecte chicken en fish op de grill.', 'Utrecht, NL', null);

-- Ingrediënten
INSERT INTO ingredients (id, name, default_unit) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zout', 'g'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Zwarte peper', 'g'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Paprikapoeder', 'g'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Knoflookpoeder', 'g'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Uienpoeder', 'g'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Cayennepeper', 'g'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Bruine suiker', 'g'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Witte suiker', 'g'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Worcestershire saus', 'ml'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'Apple cider azijn', 'ml'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Ketchup', 'ml'),
('llllllll-llll-llll-llll-llllllllllll', 'Mosterd', 'ml'),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'Honing', 'ml'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'Olijfolie', 'ml'),
('oooooooo-oooo-oooo-oooo-oooooooooooo', 'BBQ saus', 'ml'),
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'Bourbon', 'ml'),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'Beef broth', 'ml'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'Tomatenpuree', 'g'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Chipotle peppers', 'stuks'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'Liquid smoke', 'ml'),
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'Brisket', 'kg'),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'Baby back ribs', 'racks'),
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'Pork shoulder', 'kg'),
('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'Chicken thighs', 'stuks'),
('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'Zalm filet', 'kg'),
('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', 'Dille', 'g'),
('11111111-1111-1111-1111-111111111112', 'Citroen', 'stuks');

-- Tags
INSERT INTO tags (id, name) VALUES
('tag00001-0000-0000-0000-000000000001', 'low&slow'),
('tag00001-0000-0000-0000-000000000002', 'texas-style'),
('tag00001-0000-0000-0000-000000000003', 'memphis-style'),
('tag00001-0000-0000-0000-000000000004', 'carolina-style'),
('tag00001-0000-0000-0000-000000000005', 'ribs'),
('tag00001-0000-0000-0000-000000000006', 'brisket'),
('tag00001-0000-0000-0000-000000000007', 'pulled-pork'),
('tag00001-0000-0000-0000-000000000008', 'chicken'),
('tag00001-0000-0000-0000-000000000009', 'fish'),
('tag00001-0000-0000-0000-000000000010', 'smoky'),
('tag00001-0000-0000-0000-000000000011', 'tender'),
('tag00001-0000-0000-0000-000000000012', 'juicy'),
('tag00001-0000-0000-0000-000000000013', 'dry-rub'),
('tag00001-0000-0000-0000-000000000014', 'sweet'),
('tag00001-0000-0000-0000-000000000015', 'brunch');

-- Recepten
INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility) VALUES
('recipe01-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Texas Style Brisket', 'Klassieke Texas brisket met post oak rook. Perfect voor beginners en experts.', 8, 45, 720, 95, 'public'),
('recipe01-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Memphis Style Ribs', 'Dry rub ribs Memphis-style. Geen saus, alleen perfecte kruiden.', 4, 30, 360, 88, 'public'),
('recipe01-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Pulled Pork Carolina Style', 'Klassieke pulled pork met Carolina-style vinegar sauce.', 6, 20, 600, 95, 'public'),
('recipe01-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'BBQ Chicken Thighs', 'Perfecte chicken thighs met sticky BBQ glaze.', 4, 15, 45, 75, 'public'),
('recipe01-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'Smoked Salmon', 'Zalm gerookt met cherry wood. Perfect voor brunch.', 6, 30, 120, 60, 'public');

-- Recipe ingredients
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit) VALUES
-- Texas Style Brisket
('ri00001-0000-0000-0000-000000000001', 'recipe01-0000-0000-0000-000000000001', 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 4, 'kg'),
('ri00001-0000-0000-0000-000000000002', 'recipe01-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 30, 'g'),
('ri00001-0000-0000-0000-000000000003', 'recipe01-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 20, 'g'),
('ri00001-0000-0000-0000-000000000004', 'recipe01-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10, 'g'),
('ri00001-0000-0000-0000-000000000005', 'recipe01-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5, 'g'),

-- Memphis Style Ribs
('ri00001-0000-0000-0000-000000000006', 'recipe01-0000-0000-0000-000000000002', 'vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 2, 'racks'),
('ri00001-0000-0000-0000-000000000007', 'recipe01-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 20, 'g'),
('ri00001-0000-0000-0000-000000000008', 'recipe01-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 15, 'g'),
('ri00001-0000-0000-0000-000000000009', 'recipe01-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 15, 'g'),
('ri00001-0000-0000-0000-000000000010', 'recipe01-0000-0000-0000-000000000002', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 25, 'g'),
('ri00001-0000-0000-0000-000000000011', 'recipe01-0000-0000-0000-000000000002', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5, 'g'),

-- Pulled Pork Carolina Style
('ri00001-0000-0000-0000-000000000012', 'recipe01-0000-0000-0000-000000000003', 'wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 3, 'kg'),
('ri00001-0000-0000-0000-000000000013', 'recipe01-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 25, 'g'),
('ri00001-0000-0000-0000-000000000014', 'recipe01-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10, 'g'),
('ri00001-0000-0000-0000-000000000015', 'recipe01-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 15, 'g'),
('ri00001-0000-0000-0000-000000000016', 'recipe01-0000-0000-0000-000000000003', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 60, 'ml'),
('ri00001-0000-0000-0000-000000000017', 'recipe01-0000-0000-0000-000000000003', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 30, 'ml'),

-- BBQ Chicken Thighs
('ri00001-0000-0000-0000-000000000018', 'recipe01-0000-0000-0000-000000000004', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 8, 'stuks'),
('ri00001-0000-0000-0000-000000000019', 'recipe01-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 15, 'g'),
('ri00001-0000-0000-0000-000000000020', 'recipe01-0000-0000-0000-000000000004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10, 'g'),
('ri00001-0000-0000-0000-000000000021', 'recipe01-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5, 'g'),
('ri00001-0000-0000-0000-000000000022', 'recipe01-0000-0000-0000-000000000004', 'oooooooo-oooo-oooo-oooo-oooooooooooo', 200, 'ml'),
('ri00001-0000-0000-0000-000000000023', 'recipe01-0000-0000-0000-000000000004', 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 30, 'ml'),

-- Smoked Salmon
('ri00001-0000-0000-0000-000000000024', 'recipe01-0000-0000-0000-000000000005', 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 1.5, 'kg'),
('ri00001-0000-0000-0000-000000000025', 'recipe01-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'g'),
('ri00001-0000-0000-0000-000000000026', 'recipe01-0000-0000-0000-000000000005', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 30, 'g'),
('ri00001-0000-0000-0000-000000000027', 'recipe01-0000-0000-0000-000000000005', 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', 10, 'g'),
('ri00001-0000-0000-0000-000000000028', 'recipe01-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111112', 1, 'stuks');

-- Steps
INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes) VALUES
-- Texas Style Brisket
('step0001-0000-0000-0000-000000000001', 'recipe01-0000-0000-0000-000000000001', 1, 'Trim brisket en verwijder overtollig vet', 30),
('step0001-0000-0000-0000-000000000002', 'recipe01-0000-0000-0000-000000000001', 2, 'Rub aanbrengen en 12 uur laten rusten', 0),
('step0001-0000-0000-0000-000000000003', 'recipe01-0000-0000-0000-000000000001', 3, 'Indirect roken op 110°C met post oak', 480),
('step0001-0000-0000-0000-000000000004', 'recipe01-0000-0000-0000-000000000001', 4, 'Wrappen in papier bij 70°C', 180),
('step0001-0000-0000-0000-000000000005', 'recipe01-0000-0000-0000-000000000001', 5, 'Rusten in koeler 2-4 uur', 240),

-- Memphis Style Ribs
('step0001-0000-0000-0000-000000000006', 'recipe01-0000-0000-0000-000000000002', 1, 'Membrane verwijderen van ribs', 15),
('step0001-0000-0000-0000-000000000007', 'recipe01-0000-0000-0000-000000000002', 2, 'Dry rub aanbrengen', 15),
('step0001-0000-0000-0000-000000000008', 'recipe01-0000-0000-0000-000000000002', 3, 'Indirect roken op 120°C', 300),
('step0001-0000-0000-0000-000000000009', 'recipe01-0000-0000-0000-000000000002', 4, 'Wrappen en 1 uur laten garen', 60),
('step0001-0000-0000-0000-000000000010', 'recipe01-0000-0000-0000-000000000002', 5, 'Glazen met honing en 15 min roken', 15),

-- Pulled Pork Carolina Style
('step0001-0000-0000-0000-000000000011', 'recipe01-0000-0000-0000-000000000003', 1, 'Rub aanbrengen op pork shoulder', 20),
('step0001-0000-0000-0000-000000000012', 'recipe01-0000-0000-0000-000000000003', 2, 'Indirect roken op 110°C', 480),
('step0001-0000-0000-0000-000000000013', 'recipe01-0000-0000-0000-000000000003', 3, 'Wrappen bij 70°C', 120),
('step0001-0000-0000-0000-000000000014', 'recipe01-0000-0000-0000-000000000003', 4, 'Rusten en pullen', 60),

-- BBQ Chicken Thighs
('step0001-0000-0000-0000-000000000015', 'recipe01-0000-0000-0000-000000000004', 1, 'Chicken thighs kruiden', 15),
('step0001-0000-0000-0000-000000000016', 'recipe01-0000-0000-0000-000000000004', 2, 'Indirect grillen op 180°C', 30),
('step0001-0000-0000-0000-000000000017', 'recipe01-0000-0000-0000-000000000004', 3, 'Glazen met BBQ saus', 15),

-- Smoked Salmon
('step0001-0000-0000-0000-000000000018', 'recipe01-0000-0000-0000-000000000005', 1, 'Zalm zouten en 2 uur laten rusten', 120),
('step0001-0000-0000-0000-000000000019', 'recipe01-0000-0000-0000-000000000005', 2, 'Afspoelen en drogen', 10),
('step0001-0000-0000-0000-000000000020', 'recipe01-0000-0000-0000-000000000005', 3, 'Roken op 80°C met cherry wood', 90);

-- Recipe tags
INSERT INTO recipe_tags (id, recipe_id, tag_id) VALUES
-- Texas Style Brisket
('rt000001-0000-0000-0000-000000000001', 'recipe01-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000001'),
('rt000001-0000-0000-0000-000000000002', 'recipe01-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000002'),
('rt000001-0000-0000-0000-000000000003', 'recipe01-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000006'),
('rt000001-0000-0000-0000-000000000004', 'recipe01-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000010'),

-- Memphis Style Ribs
('rt000001-0000-0000-0000-000000000005', 'recipe01-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000001'),
('rt000001-0000-0000-0000-000000000006', 'recipe01-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000003'),
('rt000001-0000-0000-0000-000000000007', 'recipe01-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000005'),
('rt000001-0000-0000-0000-000000000008', 'recipe01-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000013'),

-- Pulled Pork Carolina Style
('rt000001-0000-0000-0000-000000000009', 'recipe01-0000-0000-0000-000000000003', 'tag00001-0000-0000-0000-000000000001'),
('rt000001-0000-0000-0000-000000000010', 'recipe01-0000-0000-0000-000000000003', 'tag00001-0000-0000-0000-000000000004'),
('rt000001-0000-0000-0000-000000000011', 'recipe01-0000-0000-0000-000000000003', 'tag00001-0000-0000-0000-000000000007'),
('rt000001-0000-0000-0000-000000000012', 'recipe01-0000-0000-0000-000000000003', 'tag00001-0000-0000-0000-000000000011'),

-- BBQ Chicken Thighs
('rt000001-0000-0000-0000-000000000013', 'recipe01-0000-0000-0000-000000000004', 'tag00001-0000-0000-0000-000000000008'),
('rt000001-0000-0000-0000-000000000014', 'recipe01-0000-0000-0000-000000000004', 'tag00001-0000-0000-0000-000000000012'),
('rt000001-0000-0000-0000-000000000015', 'recipe01-0000-0000-0000-000000000004', 'tag00001-0000-0000-0000-000000000014'),

-- Smoked Salmon
('rt000001-0000-0000-0000-000000000016', 'recipe01-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000009'),
('rt000001-0000-0000-0000-000000000017', 'recipe01-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000010'),
('rt000001-0000-0000-0000-000000000018', 'recipe01-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000015');

-- Cook sessions met temperatuurdata
INSERT INTO cook_sessions (id, recipe_id, user_id, started_at, ended_at, notes, rating, conclusion, adjustments) VALUES
('session01-0000-0000-0000-000000000001', 'recipe01-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2024-01-15T08:00:00Z', '2024-01-15T20:00:00Z', 'Geweldige sessie! Temperatuur was perfect gestabiliseerd. Smoke ring was perfect.', 5, 'Perfect resultaat, zeker voor herhaling vatbaar. Bark was excellent.', '{"smoke_ring": "perfect", "bark": "excellent", "tenderness": "perfect"}'),
('session01-0000-0000-0000-000000000002', 'recipe01-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '2024-01-16T10:00:00Z', '2024-01-16T16:00:00Z', 'Ribs waren perfect tender. Dry rub was uitstekend.', 4, 'Zeer goed resultaat. Volgende keer iets meer cayenne.', '{"tenderness": "perfect", "bark": "good", "spice_level": "medium"}'),
('session01-0000-0000-0000-000000000003', 'recipe01-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '2024-01-17T09:00:00Z', '2024-01-17T19:00:00Z', 'Pulled pork was perfect. Carolina sauce was geweldig.', 5, 'Fantastisch resultaat! Pulled perfect.', '{"pull": "perfect", "sauce": "excellent", "smoke": "good"}'),
('session01-0000-0000-0000-000000000004', 'recipe01-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '2024-01-18T18:00:00Z', '2024-01-18T19:30:00Z', 'Chicken thighs waren perfect juicy. BBQ glaze was sticky en lekker.', 4, 'Zeer goed resultaat. Perfect voor een snelle maaltijd.', '{"juiciness": "perfect", "glaze": "sticky", "crispiness": "good"}'),
('session01-0000-0000-0000-000000000005', 'recipe01-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', '2024-01-19T08:00:00Z', '2024-01-19T10:00:00Z', 'Zalm was perfect gerookt. Cherry wood gaf een subtiele smaak.', 5, 'Perfect voor brunch. Zeer delicate smaak.', '{"smoke": "subtle", "texture": "perfect", "flavor": "delicate"}');

-- Temperatuur logs voor elke sessie (20 readings per sessie)
INSERT INTO session_temps (id, cook_session_id, recorded_at, grate_temp, meat_temp, probe_name) VALUES
-- Session 1: Texas Style Brisket (8:00 - 20:00, elke 15 min)
('temp0001-0000-0000-0000-000000000001', 'session01-0000-0000-0000-000000000001', '2024-01-15T08:00:00Z', 110, 20, 'Probe 1'),
('temp0001-0000-0000-0000-000000000002', 'session01-0000-0000-0000-000000000001', '2024-01-15T08:15:00Z', 112, 25, 'Probe 1'),
('temp0001-0000-0000-0000-000000000003', 'session01-0000-0000-0000-000000000001', '2024-01-15T08:30:00Z', 115, 30, 'Probe 1'),
('temp0001-0000-0000-0000-000000000004', 'session01-0000-0000-0000-000000000001', '2024-01-15T08:45:00Z', 113, 35, 'Probe 1'),
('temp0001-0000-0000-0000-000000000005', 'session01-0000-0000-0000-000000000001', '2024-01-15T09:00:00Z', 114, 40, 'Probe 1'),
('temp0001-0000-0000-0000-000000000006', 'session01-0000-0000-0000-000000000001', '2024-01-15T09:15:00Z', 116, 45, 'Probe 1'),
('temp0001-0000-0000-0000-000000000007', 'session01-0000-0000-0000-000000000001', '2024-01-15T09:30:00Z', 115, 50, 'Probe 1'),
('temp0001-0000-0000-0000-000000000008', 'session01-0000-0000-0000-000000000001', '2024-01-15T09:45:00Z', 117, 55, 'Probe 1'),
('temp0001-0000-0000-0000-000000000009', 'session01-0000-0000-0000-000000000001', '2024-01-15T10:00:00Z', 118, 60, 'Probe 1'),
('temp0001-0000-0000-0000-000000000010', 'session01-0000-0000-0000-000000000001', '2024-01-15T10:15:00Z', 116, 65, 'Probe 1'),
('temp0001-0000-0000-0000-000000000011', 'session01-0000-0000-0000-000000000001', '2024-01-15T10:30:00Z', 115, 70, 'Probe 1'),
('temp0001-0000-0000-0000-000000000012', 'session01-0000-0000-0000-000000000001', '2024-01-15T10:45:00Z', 114, 75, 'Probe 1'),
('temp0001-0000-0000-0000-000000000013', 'session01-0000-0000-0000-000000000001', '2024-01-15T11:00:00Z', 113, 80, 'Probe 1'),
('temp0001-0000-0000-0000-000000000014', 'session01-0000-0000-0000-000000000001', '2024-01-15T11:15:00Z', 112, 82, 'Probe 1'),
('temp0001-0000-0000-0000-000000000015', 'session01-0000-0000-0000-000000000001', '2024-01-15T11:30:00Z', 111, 85, 'Probe 1'),
('temp0001-0000-0000-0000-000000000016', 'session01-0000-0000-0000-000000000001', '2024-01-15T11:45:00Z', 110, 88, 'Probe 1'),
('temp0001-0000-0000-0000-000000000017', 'session01-0000-0000-0000-000000000001', '2024-01-15T12:00:00Z', 109, 90, 'Probe 1'),
('temp0001-0000-0000-0000-000000000018', 'session01-0000-0000-0000-000000000001', '2024-01-15T12:15:00Z', 108, 92, 'Probe 1'),
('temp0001-0000-0000-0000-000000000019', 'session01-0000-0000-0000-000000000001', '2024-01-15T12:30:00Z', 107, 94, 'Probe 1'),
('temp0001-0000-0000-0000-000000000020', 'session01-0000-0000-0000-000000000001', '2024-01-15T12:45:00Z', 106, 95, 'Probe 1'),

-- Session 2: Memphis Style Ribs (10:00 - 16:00, elke 15 min)
('temp0001-0000-0000-0000-000000000021', 'session01-0000-0000-0000-000000000002', '2024-01-16T10:00:00Z', 120, 20, 'Probe 1'),
('temp0001-0000-0000-0000-000000000022', 'session01-0000-0000-0000-000000000002', '2024-01-16T10:15:00Z', 122, 25, 'Probe 1'),
('temp0001-0000-0000-0000-000000000023', 'session01-0000-0000-0000-000000000002', '2024-01-16T10:30:00Z', 121, 30, 'Probe 1'),
('temp0001-0000-0000-0000-000000000024', 'session01-0000-0000-0000-000000000002', '2024-01-16T10:45:00Z', 123, 35, 'Probe 1'),
('temp0001-0000-0000-0000-000000000025', 'session01-0000-0000-0000-000000000002', '2024-01-16T11:00:00Z', 122, 40, 'Probe 1'),
('temp0001-0000-0000-0000-000000000026', 'session01-0000-0000-0000-000000000002', '2024-01-16T11:15:00Z', 124, 45, 'Probe 1'),
('temp0001-0000-0000-0000-000000000027', 'session01-0000-0000-0000-000000000002', '2024-01-16T11:30:00Z', 123, 50, 'Probe 1'),
('temp0001-0000-0000-0000-000000000028', 'session01-0000-0000-0000-000000000002', '2024-01-16T11:45:00Z', 125, 55, 'Probe 1'),
('temp0001-0000-0000-0000-000000000029', 'session01-0000-0000-0000-000000000002', '2024-01-16T12:00:00Z', 124, 60, 'Probe 1'),
('temp0001-0000-0000-0000-000000000030', 'session01-0000-0000-0000-000000000002', '2024-01-16T12:15:00Z', 126, 65, 'Probe 1'),
('temp0001-0000-0000-0000-000000000031', 'session01-0000-0000-0000-000000000002', '2024-01-16T12:30:00Z', 125, 70, 'Probe 1'),
('temp0001-0000-0000-0000-000000000032', 'session01-0000-0000-0000-000000000002', '2024-01-16T12:45:00Z', 127, 75, 'Probe 1'),
('temp0001-0000-0000-0000-000000000033', 'session01-0000-0000-0000-000000000002', '2024-01-16T13:00:00Z', 126, 80, 'Probe 1'),
('temp0001-0000-0000-0000-000000000034', 'session01-0000-0000-0000-000000000002', '2024-01-16T13:15:00Z', 128, 82, 'Probe 1'),
('temp0001-0000-0000-0000-000000000035', 'session01-0000-0000-0000-000000000002', '2024-01-16T13:30:00Z', 127, 85, 'Probe 1'),
('temp0001-0000-0000-0000-000000000036', 'session01-0000-0000-0000-000000000002', '2024-01-16T13:45:00Z', 129, 86, 'Probe 1'),
('temp0001-0000-0000-0000-000000000037', 'session01-0000-0000-0000-000000000002', '2024-01-16T14:00:00Z', 128, 87, 'Probe 1'),
('temp0001-0000-0000-0000-000000000038', 'session01-0000-0000-0000-000000000002', '2024-01-16T14:15:00Z', 130, 88, 'Probe 1'),
('temp0001-0000-0000-0000-000000000039', 'session01-0000-0000-0000-000000000002', '2024-01-16T14:30:00Z', 129, 88, 'Probe 1'),
('temp0001-0000-0000-0000-000000000040', 'session01-0000-0000-0000-000000000002', '2024-01-16T14:45:00Z', 131, 88, 'Probe 1');

-- Reviews
INSERT INTO reviews (id, recipe_id, user_id, rating, comment, created_at) VALUES
-- Reviews voor Texas Style Brisket
('review01-0000-0000-0000-000000000001', 'recipe01-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 5, 'Geweldig recept! Maarten BBQ heeft dit perfect uitgevoerd. De brisket was perfect tender.', '2024-01-20T10:00:00Z'),
('review01-0000-0000-0000-000000000002', 'recipe01-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 4, 'Zeer goed recept. Smoke ring was perfect!', '2024-01-21T14:30:00Z'),

-- Reviews voor Memphis Style Ribs
('review01-0000-0000-0000-000000000003', 'recipe01-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 4, 'Geweldig recept! Sarah''s Smokehouse heeft dit perfect uitgevoerd. Dry rub was uitstekend.', '2024-01-22T16:00:00Z'),
('review01-0000-0000-0000-000000000004', 'recipe01-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 5, 'Perfecte ribs! Fall-off-the-bone tender.', '2024-01-23T12:00:00Z'),

-- Reviews voor Pulled Pork Carolina Style
('review01-0000-0000-0000-000000000005', 'recipe01-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 5, 'Geweldig recept! Sarah''s Smokehouse heeft dit perfect uitgevoerd. Carolina sauce was geweldig.', '2024-01-24T18:00:00Z'),
('review01-0000-0000-0000-000000000006', 'recipe01-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 4, 'Zeer goed pulled pork! Perfect voor sandwiches.', '2024-01-25T20:00:00Z'),

-- Reviews voor BBQ Chicken Thighs
('review01-0000-0000-0000-000000000007', 'recipe01-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 4, 'Geweldig recept! Kamado King heeft dit perfect uitgevoerd. Chicken was perfect juicy.', '2024-01-26T19:00:00Z'),
('review01-0000-0000-0000-000000000008', 'recipe01-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 5, 'Perfecte chicken thighs! BBQ glaze was sticky en lekker.', '2024-01-27T17:30:00Z'),

-- Reviews voor Smoked Salmon
('review01-0000-0000-0000-000000000009', 'recipe01-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 5, 'Geweldig recept! Kamado King heeft dit perfect uitgevoerd. Cherry wood gaf een subtiele smaak.', '2024-01-28T11:00:00Z'),
('review01-0000-0000-0000-000000000010', 'recipe01-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 4, 'Perfect voor brunch! Zeer delicate smaak.', '2024-01-29T09:30:00Z');

-- Success message
SELECT 'Demo data succesvol toegevoegd!' as message,
       (SELECT COUNT(*) FROM profiles WHERE display_name LIKE '%BBQ%' OR display_name LIKE '%Smokehouse%' OR display_name LIKE '%Kamado%') as users_count,
       (SELECT COUNT(*) FROM recipes WHERE visibility = 'public') as recipes_count,
       (SELECT COUNT(*) FROM ingredients) as ingredients_count,
       (SELECT COUNT(*) FROM tags) as tags_count,
       (SELECT COUNT(*) FROM cook_sessions) as sessions_count,
       (SELECT COUNT(*) FROM reviews) as reviews_count;
