-- Generate 50 nieuwe BBQ recepten voor Stook
-- User ID: 19d14bbb-e6f0-4bbc-bc34-ec8050a84caa
-- Voer dit script uit in Supabase SQL Editor
-- Generated: 2025-12-23T11:58:16.830Z

-- ============================================
-- CLEANUP: Verwijder alle bestaande recepten
-- Volgorde is belangrijk vanwege foreign key constraints
-- ============================================
DELETE FROM reviews;
DELETE FROM recipe_favorites;
DELETE FROM session_temps;
-- Verwijder eerst foto's die gekoppeld zijn aan cook_sessions (moet VOOR cook_sessions)
DELETE FROM photos WHERE cook_session_id IS NOT NULL;
-- Verwijder cook_sessions
DELETE FROM cook_sessions;
-- Verwijder foto's die gekoppeld zijn aan recepten (moet VOOR recipes)
DELETE FROM photos WHERE recipe_id IS NOT NULL;
-- Verwijder stappen, ingrediënten en tags (moet VOOR recipes)
DELETE FROM steps;
DELETE FROM recipe_ingredients;
DELETE FROM recipe_tags;
-- Verwijder recepten als laatste
DELETE FROM recipes;

-- ============================================
-- INGREDIËNTEN (upsert)
-- ============================================
INSERT INTO ingredients (id, name, default_unit) VALUES
(gen_random_uuid(), 'Brisket', 'g'),
(gen_random_uuid(), 'Zout', 'g'),
(gen_random_uuid(), 'Zwarte peper', 'g'),
(gen_random_uuid(), 'Paprikapoeder', 'g'),
(gen_random_uuid(), 'Knoflookpoeder', 'g'),
(gen_random_uuid(), 'Baby back ribs', 'g'),
(gen_random_uuid(), 'Bruine suiker', 'g'),
(gen_random_uuid(), 'Cayennepeper', 'g'),
(gen_random_uuid(), 'Pork shoulder', 'g'),
(gen_random_uuid(), 'Apple cider azijn', 'ml'),
(gen_random_uuid(), 'Worcestershire saus', 'ml'),
(gen_random_uuid(), 'Chicken thighs', 'g'),
(gen_random_uuid(), 'BBQ saus', 'ml'),
(gen_random_uuid(), 'Honing', 'g'),
(gen_random_uuid(), 'Zalm filet', 'g'),
(gen_random_uuid(), 'Dille', 'g'),
(gen_random_uuid(), 'Citroen', 'g'),
(gen_random_uuid(), 'Beef short ribs', 'g'),
(gen_random_uuid(), 'Chicken wings', 'g'),
(gen_random_uuid(), 'Turkey breast', 'g'),
(gen_random_uuid(), 'Rozemarijn', 'g'),
(gen_random_uuid(), 'Tijm', 'g'),
(gen_random_uuid(), 'Knoflook', 'g'),
(gen_random_uuid(), 'Lamb rack', 'g'),
(gen_random_uuid(), 'Olijfolie', 'g'),
(gen_random_uuid(), 'Tri-tip', 'g'),
(gen_random_uuid(), 'Makreel', 'g'),
(gen_random_uuid(), 'Maïskolven', 'g'),
(gen_random_uuid(), 'Boter', 'g'),
(gen_random_uuid(), 'Portobello paddenstoelen', 'g'),
(gen_random_uuid(), 'Paprika', 'g'),
(gen_random_uuid(), 'Feta kaas', 'g'),
(gen_random_uuid(), 'Brisket punt', 'g'),
(gen_random_uuid(), 'Hele kip', 'g'),
(gen_random_uuid(), 'Uienpoeder', 'g'),
(gen_random_uuid(), 'Pork belly', 'g'),
(gen_random_uuid(), 'Gekookte ham', 'g'),
(gen_random_uuid(), 'Mosterd', 'g'),
(gen_random_uuid(), 'Kruidnagel', 'g'),
(gen_random_uuid(), 'Bratwurst', 'g'),
(gen_random_uuid(), 'Chorizo', 'g'),
(gen_random_uuid(), 'Italian sausage', 'ml'),
(gen_random_uuid(), 'Tonijn steaks', 'g'),
(gen_random_uuid(), 'Sesamzaad', 'g'),
(gen_random_uuid(), 'Sojasaus', 'ml'),
(gen_random_uuid(), 'Gember', 'g'),
(gen_random_uuid(), 'Jalapeños', 'g'),
(gen_random_uuid(), 'Roomkaas', 'g'),
(gen_random_uuid(), 'Bacon', 'g'),
(gen_random_uuid(), 'Cheddar kaas', 'g'),
(gen_random_uuid(), 'Eendenborst', 'g'),
(gen_random_uuid(), 'Vijgen', 'g'),
(gen_random_uuid(), 'Port', 'g'),
(gen_random_uuid(), 'Bloemkool', 'g'),
(gen_random_uuid(), 'Kummel', 'g'),
(gen_random_uuid(), 'Ananas', 'g'),
(gen_random_uuid(), 'Kaneel', 'g'),
(gen_random_uuid(), 'Varkenshaas', 'g'),
(gen_random_uuid(), 'Garnalen', 'g'),
(gen_random_uuid(), 'Peterselie', 'g'),
(gen_random_uuid(), 'Runderlappen', 'g'),
(gen_random_uuid(), 'Liquid smoke', 'g'),
(gen_random_uuid(), 'Courgettes', 'g'),
(gen_random_uuid(), 'Gehakt', 'g'),
(gen_random_uuid(), 'Ui', 'g'),
(gen_random_uuid(), 'Tomatenpuree', 'g'),
(gen_random_uuid(), 'Mozzarella', 'g'),
(gen_random_uuid(), 'Hele kalkoen', 'g'),
(gen_random_uuid(), 'Lamsribbetjes', 'g'),
(gen_random_uuid(), 'Munt', 'g'),
(gen_random_uuid(), 'Grote tomaten', 'g'),
(gen_random_uuid(), 'Risotto', 'g'),
(gen_random_uuid(), 'Parmezaan', 'g'),
(gen_random_uuid(), 'Basilicum', 'g'),
(gen_random_uuid(), 'Hertenvlees', 'g'),
(gen_random_uuid(), 'Jeneverbessen', 'g'),
(gen_random_uuid(), 'Halloumi', 'g'),
(gen_random_uuid(), 'Courgette', 'g'),
(gen_random_uuid(), 'Oregano', 'g'),
(gen_random_uuid(), 'Oesters', 'g'),
(gen_random_uuid(), 'Zoete aardappelen', 'g'),
(gen_random_uuid(), 'St. Louis ribs', 'g'),
(gen_random_uuid(), 'Balsamico azijn', 'ml'),
(gen_random_uuid(), 'Burger buns', 'g'),
(gen_random_uuid(), 'Runderwangen', 'g'),
(gen_random_uuid(), 'Rode wijn', 'g'),
(gen_random_uuid(), 'Asperges', 'g'),
(gen_random_uuid(), 'Appelcider', 'g'),
(gen_random_uuid(), 'Aubergines', 'g'),
(gen_random_uuid(), 'Tahini', 'g'),
(gen_random_uuid(), 'Granaatappel', 'g'),
(gen_random_uuid(), 'Hele vis (zeebaars)', 'g'),
(gen_random_uuid(), 'Grote uien', 'g'),
(gen_random_uuid(), 'Breadcrumbs', 'g')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TAGS (upsert)
-- ============================================
INSERT INTO tags (id, name) VALUES
(gen_random_uuid(), 'low&slow'),
(gen_random_uuid(), 'texas-style'),
(gen_random_uuid(), 'brisket'),
(gen_random_uuid(), 'smoky'),
(gen_random_uuid(), 'memphis-style'),
(gen_random_uuid(), 'ribs'),
(gen_random_uuid(), 'carolina-style'),
(gen_random_uuid(), 'pulled-pork'),
(gen_random_uuid(), 'tender'),
(gen_random_uuid(), 'grilling'),
(gen_random_uuid(), 'chicken'),
(gen_random_uuid(), 'sweet'),
(gen_random_uuid(), 'juicy'),
(gen_random_uuid(), 'fish'),
(gen_random_uuid(), 'cherry'),
(gen_random_uuid(), 'kansas-city'),
(gen_random_uuid(), 'beef'),
(gen_random_uuid(), 'spicy'),
(gen_random_uuid(), 'crispy'),
(gen_random_uuid(), 'turkey'),
(gen_random_uuid(), 'lamb'),
(gen_random_uuid(), 'vegetarian'),
(gen_random_uuid(), 'roasting')
ON CONFLICT (name) DO NOTHING;

-- Recept 1: Texas Style Brisket
DO $$
DECLARE
  recipe_01_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Brisket' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'texas-style' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'brisket' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_01_id, user_id_val, 'Texas Style Brisket', 'Klassieke Texas brisket met post oak rook. Perfect voor beginners en experts. Low & slow tot perfecte tenderheid.', 8, 45, 720, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_01_id, ing_0_id, 4, 'kg'),
    (gen_random_uuid(), recipe_01_id, ing_1_id, 30, 'g'),
    (gen_random_uuid(), recipe_01_id, ing_2_id, 20, 'g'),
    (gen_random_uuid(), recipe_01_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_01_id, ing_4_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_01_id, 1, 'Trim brisket en verwijder overtollig vet, laat ongeveer 6mm vetlaag', 30),
    (gen_random_uuid(), recipe_01_id, 2, 'Rub aanbrengen en 12 uur in koelkast laten rusten', NULL),
    (gen_random_uuid(), recipe_01_id, 3, 'Indirect roken op 110°C met post oak hout', 480),
    (gen_random_uuid(), recipe_01_id, 4, 'Wrappen in butchers paper bij 70°C interne temperatuur', 180),
    (gen_random_uuid(), recipe_01_id, 5, 'Rusten in koeler 2-4 uur, minimaal 1 uur', 240);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_01_id, tag_0_id),
    (gen_random_uuid(), recipe_01_id, tag_1_id),
    (gen_random_uuid(), recipe_01_id, tag_2_id),
    (gen_random_uuid(), recipe_01_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_01_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_01_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 2: Memphis Style Ribs
DO $$
DECLARE
  recipe_02_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Baby back ribs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Cayennepeper' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'memphis-style' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'ribs' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_02_id, user_id_val, 'Memphis Style Ribs', 'Dry rub ribs Memphis-style. Geen saus, alleen perfecte kruiden en rook.', 4, 30, 360, 88, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_02_id, ing_0_id, 2, 'racks'),
    (gen_random_uuid(), recipe_02_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_02_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_02_id, ing_3_id, 15, 'g'),
    (gen_random_uuid(), recipe_02_id, ing_4_id, 25, 'g'),
    (gen_random_uuid(), recipe_02_id, ing_5_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_02_id, 1, 'Membrane verwijderen van de achterkant van de ribs', 15),
    (gen_random_uuid(), recipe_02_id, 2, 'Dry rub royaal aanbrengen aan beide kanten', 15),
    (gen_random_uuid(), recipe_02_id, 3, 'Indirect roken op 120°C met hickory hout', 300),
    (gen_random_uuid(), recipe_02_id, 4, 'Wrappen in folie en 1 uur laten garen', 60),
    (gen_random_uuid(), recipe_02_id, 5, 'Glazen met honing en 15 minuten terug op de grill', 15);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_02_id, tag_0_id),
    (gen_random_uuid(), recipe_02_id, tag_1_id),
    (gen_random_uuid(), recipe_02_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_02_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_02_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 3: Pulled Pork Carolina Style
DO $$
DECLARE
  recipe_03_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Pork shoulder' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Apple cider azijn' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Worcestershire saus' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'carolina-style' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'pulled-pork' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_03_id, user_id_val, 'Pulled Pork Carolina Style', 'Klassieke pulled pork met Carolina-style vinegar sauce. Perfect voor sandwiches.', 6, 20, 600, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_03_id, ing_0_id, 3, 'kg'),
    (gen_random_uuid(), recipe_03_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_03_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_03_id, ing_3_id, 15, 'g'),
    (gen_random_uuid(), recipe_03_id, ing_4_id, 60, 'ml'),
    (gen_random_uuid(), recipe_03_id, ing_5_id, 30, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_03_id, 1, 'Rub aanbrengen op pork shoulder en 2 uur laten marineren', 20),
    (gen_random_uuid(), recipe_03_id, 2, 'Indirect roken op 110°C met hickory hout', 480),
    (gen_random_uuid(), recipe_03_id, 3, 'Wrappen in folie bij 70°C interne temperatuur', 120),
    (gen_random_uuid(), recipe_03_id, 4, 'Rusten 1 uur en daarna pullen met vorken', 60);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_03_id, tag_0_id),
    (gen_random_uuid(), recipe_03_id, tag_1_id),
    (gen_random_uuid(), recipe_03_id, tag_2_id),
    (gen_random_uuid(), recipe_03_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_03_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_03_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 4: BBQ Chicken Thighs
DO $$
DECLARE
  recipe_04_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Chicken thighs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'BBQ saus' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Honing' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'chicken' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'sweet' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'juicy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_04_id, user_id_val, 'BBQ Chicken Thighs', 'Perfecte chicken thighs met sticky BBQ glaze. Snel en smaakvol.', 4, 15, 45, 75, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_04_id, ing_0_id, 8, 'stuks'),
    (gen_random_uuid(), recipe_04_id, ing_1_id, 15, 'g'),
    (gen_random_uuid(), recipe_04_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_04_id, ing_3_id, 5, 'g'),
    (gen_random_uuid(), recipe_04_id, ing_4_id, 200, 'ml'),
    (gen_random_uuid(), recipe_04_id, ing_5_id, 30, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_04_id, 1, 'Chicken thighs kruiden met zout, paprika en knoflook', 15),
    (gen_random_uuid(), recipe_04_id, 2, 'Indirect grillen op 180°C tot goudbruin', 30),
    (gen_random_uuid(), recipe_04_id, 3, 'Glazen met BBQ saus en honing, laatste 5 minuten', 15);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_04_id, tag_0_id),
    (gen_random_uuid(), recipe_04_id, tag_1_id),
    (gen_random_uuid(), recipe_04_id, tag_2_id),
    (gen_random_uuid(), recipe_04_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_04_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_04_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 5: Smoked Salmon
DO $$
DECLARE
  recipe_05_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Zalm filet' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Dille' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'fish' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'cherry' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_05_id, user_id_val, 'Smoked Salmon', 'Zalm gerookt met cherry wood. Perfect voor brunch of als voorgerecht.', 6, 30, 120, 60, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_05_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_05_id, ing_1_id, 50, 'g'),
    (gen_random_uuid(), recipe_05_id, ing_2_id, 30, 'g'),
    (gen_random_uuid(), recipe_05_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_05_id, ing_4_id, 1, 'stuks');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_05_id, 1, 'Zalm zouten en 2 uur laten rusten in koelkast', 120),
    (gen_random_uuid(), recipe_05_id, 2, 'Afspoelen en drogen met keukenpapier', 10),
    (gen_random_uuid(), recipe_05_id, 3, 'Roken op 80°C met cherry wood tot gewenste donkerte', 90);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_05_id, tag_0_id),
    (gen_random_uuid(), recipe_05_id, tag_1_id),
    (gen_random_uuid(), recipe_05_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_05_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_05_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 6: Kansas City Style Ribs
DO $$
DECLARE
  recipe_06_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Baby back ribs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'BBQ saus' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'kansas-city' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'ribs' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'sweet' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_06_id, user_id_val, 'Kansas City Style Ribs', 'Sticky ribs met zoete BBQ saus. Klassiek Kansas City recept.', 4, 25, 300, 88, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_06_id, ing_0_id, 2, 'racks'),
    (gen_random_uuid(), recipe_06_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_06_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_06_id, ing_3_id, 15, 'g'),
    (gen_random_uuid(), recipe_06_id, ing_4_id, 30, 'g'),
    (gen_random_uuid(), recipe_06_id, ing_5_id, 300, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_06_id, 1, 'Membrane verwijderen en dry rub aanbrengen', 25),
    (gen_random_uuid(), recipe_06_id, 2, 'Roken op 120°C voor 3 uur', 180),
    (gen_random_uuid(), recipe_06_id, 3, 'Wrappen en 1 uur garen', 60),
    (gen_random_uuid(), recipe_06_id, 4, 'Glazen met BBQ saus laatste 30 minuten', 30);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_06_id, tag_0_id),
    (gen_random_uuid(), recipe_06_id, tag_1_id),
    (gen_random_uuid(), recipe_06_id, tag_2_id),
    (gen_random_uuid(), recipe_06_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_06_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_06_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 7: Beef Short Ribs
DO $$
DECLARE
  recipe_07_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Beef short ribs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'beef' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_07_id, user_id_val, 'Beef Short Ribs', 'Malse short ribs met rijke smaak. Perfect voor speciale gelegenheden.', 4, 30, 360, 90, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_07_id, ing_0_id, 2, 'kg'),
    (gen_random_uuid(), recipe_07_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_07_id, ing_2_id, 20, 'g'),
    (gen_random_uuid(), recipe_07_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_07_id, ing_4_id, 15, 'g'),
    (gen_random_uuid(), recipe_07_id, ing_5_id, 20, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_07_id, 1, 'Short ribs trimmen en drogen', 30),
    (gen_random_uuid(), recipe_07_id, 2, 'Rub aanbrengen en 4 uur marineren', NULL),
    (gen_random_uuid(), recipe_07_id, 3, 'Roken op 110°C met post oak', 300),
    (gen_random_uuid(), recipe_07_id, 4, 'Wrappen en 1 uur garen', 60);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_07_id, tag_0_id),
    (gen_random_uuid(), recipe_07_id, tag_1_id),
    (gen_random_uuid(), recipe_07_id, tag_2_id),
    (gen_random_uuid(), recipe_07_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_07_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_07_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 8: BBQ Chicken Wings
DO $$
DECLARE
  recipe_08_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Chicken wings' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Cayennepeper' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'BBQ saus' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Honing' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'chicken' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'spicy' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'crispy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_08_id, user_id_val, 'BBQ Chicken Wings', 'Krokante chicken wings met spicy BBQ saus. Perfect als snack.', 4, 20, 60, 75, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_08_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_08_id, ing_1_id, 15, 'g'),
    (gen_random_uuid(), recipe_08_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_08_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_08_id, ing_4_id, 200, 'ml'),
    (gen_random_uuid(), recipe_08_id, ing_5_id, 40, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_08_id, 1, 'Wings drogen en kruiden', 20),
    (gen_random_uuid(), recipe_08_id, 2, 'Indirect grillen op 180°C tot krokant', 45),
    (gen_random_uuid(), recipe_08_id, 3, 'Glazen met spicy BBQ saus', 15);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_08_id, tag_0_id),
    (gen_random_uuid(), recipe_08_id, tag_1_id),
    (gen_random_uuid(), recipe_08_id, tag_2_id),
    (gen_random_uuid(), recipe_08_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_08_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_08_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 9: Smoked Turkey Breast
DO $$
DECLARE
  recipe_09_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Turkey breast' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'turkey' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_09_id, user_id_val, 'Smoked Turkey Breast', 'Malse kalkoenborst gerookt met appelhout. Perfect voor feestdagen.', 8, 30, 240, 70, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_09_id, ing_0_id, 2.5, 'kg'),
    (gen_random_uuid(), recipe_09_id, ing_1_id, 30, 'g'),
    (gen_random_uuid(), recipe_09_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_09_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_09_id, ing_4_id, 10, 'g'),
    (gen_random_uuid(), recipe_09_id, ing_5_id, 4, 'tenen');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_09_id, 1, 'Turkey breast drogen en kruiden', 30),
    (gen_random_uuid(), recipe_09_id, 2, 'Roken op 120°C met appelhout', 180),
    (gen_random_uuid(), recipe_09_id, 3, 'Rusten 30 minuten voor snijden', 30);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_09_id, tag_0_id),
    (gen_random_uuid(), recipe_09_id, tag_1_id),
    (gen_random_uuid(), recipe_09_id, tag_2_id),
    (gen_random_uuid(), recipe_09_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_09_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_09_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 10: Lamb Rack
DO $$
DECLARE
  recipe_10_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  ing_6_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Lamb rack' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_6_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'lamb' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'juicy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_10_id, user_id_val, 'Lamb Rack', 'Lamsrack met mediterrane kruiden. Elegant en smaakvol.', 4, 20, 45, 60, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_10_id, ing_0_id, 1.2, 'kg'),
    (gen_random_uuid(), recipe_10_id, ing_1_id, 15, 'g'),
    (gen_random_uuid(), recipe_10_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_10_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_10_id, ing_4_id, 8, 'g'),
    (gen_random_uuid(), recipe_10_id, ing_5_id, 3, 'tenen'),
    (gen_random_uuid(), recipe_10_id, ing_6_id, 30, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_10_id, 1, 'Lamb rack kruiden met rozemarijn, tijm en knoflook', 20),
    (gen_random_uuid(), recipe_10_id, 2, 'Grillen op 200°C tot medium-rare', 25),
    (gen_random_uuid(), recipe_10_id, 3, 'Rusten 10 minuten voor serveren', 10);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_10_id, tag_0_id),
    (gen_random_uuid(), recipe_10_id, tag_1_id),
    (gen_random_uuid(), recipe_10_id, tag_2_id),
    (gen_random_uuid(), recipe_10_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_10_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_10_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 11: Tri-Tip
DO $$
DECLARE
  recipe_11_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Tri-tip' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'beef' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'juicy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_11_id, user_id_val, 'Tri-Tip', 'California style tri-tip. Snel en smaakvol stuk vlees.', 6, 15, 90, 55, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_11_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_11_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_11_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_11_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_11_id, ing_4_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_11_id, 1, 'Tri-tip drogen en rub aanbrengen', 15),
    (gen_random_uuid(), recipe_11_id, 2, 'Indirect grillen op 150°C tot medium-rare', 60),
    (gen_random_uuid(), recipe_11_id, 3, 'Rusten 15 minuten', 15);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_11_id, tag_0_id),
    (gen_random_uuid(), recipe_11_id, tag_1_id),
    (gen_random_uuid(), recipe_11_id, tag_2_id),
    (gen_random_uuid(), recipe_11_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_11_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_11_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 12: Smoked Mackerel
DO $$
DECLARE
  recipe_12_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Makreel' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'fish' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_12_id, user_id_val, 'Smoked Mackerel', 'Makreel gerookt met beukenhout. Rijk en vol van smaak.', 4, 20, 90, 65, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_12_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_12_id, ing_1_id, 40, 'g'),
    (gen_random_uuid(), recipe_12_id, ing_2_id, 25, 'g'),
    (gen_random_uuid(), recipe_12_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_12_id, ing_4_id, 2, 'stuks');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_12_id, 1, 'Makreel zouten en 1 uur laten rusten', 60),
    (gen_random_uuid(), recipe_12_id, 2, 'Afspoelen en drogen', 10),
    (gen_random_uuid(), recipe_12_id, 3, 'Roken op 90°C met beukenhout', 80);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_12_id, tag_0_id),
    (gen_random_uuid(), recipe_12_id, tag_1_id),
    (gen_random_uuid(), recipe_12_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_12_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_12_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 13: BBQ Pulled Chicken
DO $$
DECLARE
  recipe_13_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Chicken thighs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'BBQ saus' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Apple cider azijn' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'chicken' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'pulled-pork' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'sweet' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_13_id, user_id_val, 'BBQ Pulled Chicken', 'Pulled chicken met zoete BBQ saus. Lichter alternatief voor pulled pork.', 6, 20, 180, 75, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_13_id, ing_0_id, 2, 'kg'),
    (gen_random_uuid(), recipe_13_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_13_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_13_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_13_id, ing_4_id, 250, 'ml'),
    (gen_random_uuid(), recipe_13_id, ing_5_id, 30, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_13_id, 1, 'Chicken thighs kruiden', 20),
    (gen_random_uuid(), recipe_13_id, 2, 'Roken op 120°C tot gaar', 120),
    (gen_random_uuid(), recipe_13_id, 3, 'Pullen en mengen met BBQ saus', 40);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_13_id, tag_0_id),
    (gen_random_uuid(), recipe_13_id, tag_1_id),
    (gen_random_uuid(), recipe_13_id, tag_2_id),
    (gen_random_uuid(), recipe_13_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_13_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_13_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 14: BBQ Corn on the Cob
DO $$
DECLARE
  recipe_14_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Maïskolven' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Boter' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'sweet' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_14_id, user_id_val, 'BBQ Corn on the Cob', 'Zoete maïskolven met boter en kruiden. Perfect bijgerecht.', 4, 10, 20, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_14_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_14_id, ing_1_id, 50, 'g'),
    (gen_random_uuid(), recipe_14_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_14_id, ing_3_id, 5, 'g'),
    (gen_random_uuid(), recipe_14_id, ing_4_id, 3, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_14_id, 1, 'Maïskolven schoonmaken', 10),
    (gen_random_uuid(), recipe_14_id, 2, 'Grillen op 200°C tot goudbruin, regelmatig draaien', 15),
    (gen_random_uuid(), recipe_14_id, 3, 'Inboteren en kruiden', 5);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_14_id, tag_0_id),
    (gen_random_uuid(), recipe_14_id, tag_1_id),
    (gen_random_uuid(), recipe_14_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_14_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_14_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 15: Smoked Portobello Mushrooms
DO $$
DECLARE
  recipe_15_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Portobello paddenstoelen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_15_id, user_id_val, 'Smoked Portobello Mushrooms', 'Grote portobello paddenstoelen gerookt. Vegetarisch hoofdgerecht.', 4, 15, 45, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_15_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_15_id, ing_1_id, 40, 'ml'),
    (gen_random_uuid(), recipe_15_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_15_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_15_id, ing_4_id, 3, 'tenen'),
    (gen_random_uuid(), recipe_15_id, ing_5_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_15_id, 1, 'Paddenstoelen schoonmaken en marineren', 15),
    (gen_random_uuid(), recipe_15_id, 2, 'Roken op 120°C tot zacht en smaakvol', 30),
    (gen_random_uuid(), recipe_15_id, 3, 'Serveren met verse kruiden', NULL);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_15_id, tag_0_id),
    (gen_random_uuid(), recipe_15_id, tag_1_id),
    (gen_random_uuid(), recipe_15_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_15_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_15_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 16: BBQ Stuffed Peppers
DO $$
DECLARE
  recipe_16_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Paprika' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Feta kaas' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'sweet' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_16_id, user_id_val, 'BBQ Stuffed Peppers', 'Paprika''s gevuld met kaas en kruiden. Kleurrijk bijgerecht.', 4, 25, 30, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_16_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_16_id, ing_1_id, 200, 'g'),
    (gen_random_uuid(), recipe_16_id, ing_2_id, 30, 'ml'),
    (gen_random_uuid(), recipe_16_id, ing_3_id, 2, 'tenen'),
    (gen_random_uuid(), recipe_16_id, ing_4_id, 5, 'g'),
    (gen_random_uuid(), recipe_16_id, ing_5_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_16_id, 1, 'Paprika''s halveren en zaden verwijderen', 15),
    (gen_random_uuid(), recipe_16_id, 2, 'Vullen met feta en kruiden', 10),
    (gen_random_uuid(), recipe_16_id, 3, 'Grillen op 180°C tot zacht', 25);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_16_id, tag_0_id),
    (gen_random_uuid(), recipe_16_id, tag_1_id),
    (gen_random_uuid(), recipe_16_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_16_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_16_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 17: Beef Brisket Burnt Ends
DO $$
DECLARE
  recipe_17_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  ing_6_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Brisket punt' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'BBQ saus' LIMIT 1;
  SELECT id INTO ing_6_id FROM ingredients WHERE name = 'Honing' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'kansas-city' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'brisket' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'sweet' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_17_id, user_id_val, 'Beef Brisket Burnt Ends', 'Kubusjes brisket punt met sticky glaze. Kansas City specialiteit.', 6, 30, 480, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_17_id, ing_0_id, 2, 'kg'),
    (gen_random_uuid(), recipe_17_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_17_id, ing_2_id, 20, 'g'),
    (gen_random_uuid(), recipe_17_id, ing_3_id, 15, 'g'),
    (gen_random_uuid(), recipe_17_id, ing_4_id, 50, 'g'),
    (gen_random_uuid(), recipe_17_id, ing_5_id, 200, 'ml'),
    (gen_random_uuid(), recipe_17_id, ing_6_id, 50, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_17_id, 1, 'Brisket punt roken op 110°C tot 95°C intern', 420),
    (gen_random_uuid(), recipe_17_id, 2, 'Snijden in kubusjes van 2cm', 15),
    (gen_random_uuid(), recipe_17_id, 3, 'Mengen met suiker, saus en honing', 5),
    (gen_random_uuid(), recipe_17_id, 4, 'Terug op grill 30 minuten tot kleverig', 30);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_17_id, tag_0_id),
    (gen_random_uuid(), recipe_17_id, tag_1_id),
    (gen_random_uuid(), recipe_17_id, tag_2_id),
    (gen_random_uuid(), recipe_17_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_17_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_17_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 18: BBQ Whole Chicken
DO $$
DECLARE
  recipe_18_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Hele kip' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Uienpoeder' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'chicken' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_18_id, user_id_val, 'BBQ Whole Chicken', 'Hele kip gerookt met kruiden. Perfect voor zondag.', 6, 30, 180, 75, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_18_id, ing_0_id, 1.8, 'kg'),
    (gen_random_uuid(), recipe_18_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_18_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_18_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_18_id, ing_4_id, 8, 'g'),
    (gen_random_uuid(), recipe_18_id, ing_5_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_18_id, 1, 'Kip drogen en kruiden onder de huid en buitenkant', 30),
    (gen_random_uuid(), recipe_18_id, 2, 'Roken op 120°C tot 75°C in borst', 150),
    (gen_random_uuid(), recipe_18_id, 3, 'Rusten 20 minuten voor snijden', 20);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_18_id, tag_0_id),
    (gen_random_uuid(), recipe_18_id, tag_1_id),
    (gen_random_uuid(), recipe_18_id, tag_2_id),
    (gen_random_uuid(), recipe_18_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_18_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_18_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 19: Smoked Pork Belly
DO $$
DECLARE
  recipe_19_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Pork belly' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'pulled-pork' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'crispy' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_19_id, user_id_val, 'Smoked Pork Belly', 'Crispy pork belly met perfecte balans tussen vet en vlees.', 6, 45, 300, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_19_id, ing_0_id, 2, 'kg'),
    (gen_random_uuid(), recipe_19_id, ing_1_id, 30, 'g'),
    (gen_random_uuid(), recipe_19_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_19_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_19_id, ing_4_id, 20, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_19_id, 1, 'Pork belly scoren en drogen', 30),
    (gen_random_uuid(), recipe_19_id, 2, 'Rub aanbrengen en 12 uur marineren', NULL),
    (gen_random_uuid(), recipe_19_id, 3, 'Roken op 110°C tot 95°C intern', 240),
    (gen_random_uuid(), recipe_19_id, 4, 'Crispy maken op 200°C laatste 30 minuten', 30);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_19_id, tag_0_id),
    (gen_random_uuid(), recipe_19_id, tag_1_id),
    (gen_random_uuid(), recipe_19_id, tag_2_id),
    (gen_random_uuid(), recipe_19_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_19_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_19_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 20: BBQ Beef Ribs
DO $$
DECLARE
  recipe_20_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Beef short ribs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'beef' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'ribs' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_20_id, user_id_val, 'BBQ Beef Ribs', 'Massieve beef ribs met rijke smaak. Voor de echte vleesliefhebber.', 4, 30, 360, 90, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_20_id, ing_0_id, 2.5, 'kg'),
    (gen_random_uuid(), recipe_20_id, ing_1_id, 30, 'g'),
    (gen_random_uuid(), recipe_20_id, ing_2_id, 25, 'g'),
    (gen_random_uuid(), recipe_20_id, ing_3_id, 12, 'g'),
    (gen_random_uuid(), recipe_20_id, ing_4_id, 15, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_20_id, 1, 'Ribs trimmen en drogen', 30),
    (gen_random_uuid(), recipe_20_id, 2, 'Rub aanbrengen', NULL),
    (gen_random_uuid(), recipe_20_id, 3, 'Roken op 110°C met post oak', 300),
    (gen_random_uuid(), recipe_20_id, 4, 'Wrappen en 1 uur garen', 60);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_20_id, tag_0_id),
    (gen_random_uuid(), recipe_20_id, tag_1_id),
    (gen_random_uuid(), recipe_20_id, tag_2_id),
    (gen_random_uuid(), recipe_20_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_20_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_20_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 21: Honey Glazed Ham
DO $$
DECLARE
  recipe_21_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Gekookte ham' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Honing' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Mosterd' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Kruidnagel' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'roasting' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'sweet' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_21_id, user_id_val, 'Honey Glazed Ham', 'Gekookte ham met honing glaze. Perfect voor feestdagen.', 10, 20, 120, 70, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_21_id, ing_0_id, 3, 'kg'),
    (gen_random_uuid(), recipe_21_id, ing_1_id, 150, 'ml'),
    (gen_random_uuid(), recipe_21_id, ing_2_id, 100, 'g'),
    (gen_random_uuid(), recipe_21_id, ing_3_id, 30, 'ml'),
    (gen_random_uuid(), recipe_21_id, ing_4_id, 10, 'stuks');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_21_id, 1, 'Ham scoren in ruitpatroon', 15),
    (gen_random_uuid(), recipe_21_id, 2, 'Glaze maken van honing, suiker en mosterd', 5),
    (gen_random_uuid(), recipe_21_id, 3, 'Grillen op 150°C en regelmatig glazen', 100);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_21_id, tag_0_id),
    (gen_random_uuid(), recipe_21_id, tag_1_id),
    (gen_random_uuid(), recipe_21_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_21_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_21_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 22: BBQ Sausage Platter
DO $$
DECLARE
  recipe_22_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Bratwurst' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Chorizo' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Italian sausage' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'spicy' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'juicy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_22_id, user_id_val, 'BBQ Sausage Platter', 'Mix van verschillende worsten. Perfect voor feesten.', 6, 15, 45, 75, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_22_id, ing_0_id, 6, 'stuks'),
    (gen_random_uuid(), recipe_22_id, ing_1_id, 6, 'stuks'),
    (gen_random_uuid(), recipe_22_id, ing_2_id, 6, 'stuks'),
    (gen_random_uuid(), recipe_22_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_22_id, ing_4_id, 8, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_22_id, 1, 'Worsten prikken met vork', 5),
    (gen_random_uuid(), recipe_22_id, 2, 'Indirect grillen op 150°C tot 75°C intern', 35),
    (gen_random_uuid(), recipe_22_id, 3, 'Kort op hoge temperatuur voor kleur', 10);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_22_id, tag_0_id),
    (gen_random_uuid(), recipe_22_id, tag_1_id),
    (gen_random_uuid(), recipe_22_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_22_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_22_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 23: Smoked Tuna Steaks
DO $$
DECLARE
  recipe_23_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Tonijn steaks' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Sesamzaad' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Sojasaus' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Gember' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'fish' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_23_id, user_id_val, 'Smoked Tuna Steaks', 'Tonijnsteaks met seared buitenkant. Snel en elegant.', 4, 15, 20, 50, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_23_id, ing_0_id, 800, 'g'),
    (gen_random_uuid(), recipe_23_id, ing_1_id, 15, 'g'),
    (gen_random_uuid(), recipe_23_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_23_id, ing_3_id, 20, 'g'),
    (gen_random_uuid(), recipe_23_id, ing_4_id, 30, 'ml'),
    (gen_random_uuid(), recipe_23_id, ing_5_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_23_id, 1, 'Tonijn marineren in sojasaus en gember', 15),
    (gen_random_uuid(), recipe_23_id, 2, 'Sesamzaad aanbrengen', NULL),
    (gen_random_uuid(), recipe_23_id, 3, 'Snel grillen op 250°C, 2 minuten per kant', 4);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_23_id, tag_0_id),
    (gen_random_uuid(), recipe_23_id, tag_1_id),
    (gen_random_uuid(), recipe_23_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_23_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_23_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 24: BBQ Stuffed Jalapeños
DO $$
DECLARE
  recipe_24_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Jalapeños' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Roomkaas' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Bacon' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Cheddar kaas' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'spicy' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'grilling' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_24_id, user_id_val, 'BBQ Stuffed Jalapeños', 'Jalapeños gevuld met roomkaas en bacon. Spicy en creamy.', 6, 25, 30, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_24_id, ing_0_id, 12, 'stuks'),
    (gen_random_uuid(), recipe_24_id, ing_1_id, 200, 'g'),
    (gen_random_uuid(), recipe_24_id, ing_2_id, 200, 'g'),
    (gen_random_uuid(), recipe_24_id, ing_3_id, 100, 'g'),
    (gen_random_uuid(), recipe_24_id, ing_4_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_24_id, 1, 'Jalapeños halveren en zaden verwijderen', 15),
    (gen_random_uuid(), recipe_24_id, 2, 'Vullen met roomkaas en bacon', 10),
    (gen_random_uuid(), recipe_24_id, 3, 'Grillen op 180°C tot zacht en kaas gesmolten', 25);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_24_id, tag_0_id),
    (gen_random_uuid(), recipe_24_id, tag_1_id),
    (gen_random_uuid(), recipe_24_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_24_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_24_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 25: Smoked Duck Breast
DO $$
DECLARE
  recipe_25_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Eendenborst' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Vijgen' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Port' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_25_id, user_id_val, 'Smoked Duck Breast', 'Eendenborst gerookt tot medium-rare. Rijk en elegant.', 4, 30, 90, 60, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_25_id, ing_0_id, 800, 'g'),
    (gen_random_uuid(), recipe_25_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_25_id, ing_2_id, 12, 'g'),
    (gen_random_uuid(), recipe_25_id, ing_3_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_25_id, ing_4_id, 100, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_25_id, 1, 'Eendenborst scoren en kruiden', 30),
    (gen_random_uuid(), recipe_25_id, 2, 'Roken op 120°C tot medium-rare', 60),
    (gen_random_uuid(), recipe_25_id, 3, 'Rusten 10 minuten', 10);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_25_id, tag_0_id),
    (gen_random_uuid(), recipe_25_id, tag_1_id),
    (gen_random_uuid(), recipe_25_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_25_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_25_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 26: BBQ Cauliflower Steaks
DO $$
DECLARE
  recipe_26_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Bloemkool' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Kummel' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_26_id, user_id_val, 'BBQ Cauliflower Steaks', 'Dikke plakken bloemkool met BBQ kruiden. Vegetarisch hoofdgerecht.', 4, 15, 30, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_26_id, ing_0_id, 1, 'stuks'),
    (gen_random_uuid(), recipe_26_id, ing_1_id, 40, 'ml'),
    (gen_random_uuid(), recipe_26_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_26_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_26_id, ing_4_id, 5, 'g'),
    (gen_random_uuid(), recipe_26_id, ing_5_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_26_id, 1, 'Bloemkool in dikke plakken snijden', 10),
    (gen_random_uuid(), recipe_26_id, 2, 'Marineren met olie en kruiden', 5),
    (gen_random_uuid(), recipe_26_id, 3, 'Grillen op 180°C tot goudbruin en zacht', 25);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_26_id, tag_0_id),
    (gen_random_uuid(), recipe_26_id, tag_1_id),
    (gen_random_uuid(), recipe_26_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_26_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_26_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 27: BBQ Pineapple
DO $$
DECLARE
  recipe_27_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Ananas' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Kaneel' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Boter' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'sweet' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'grilling' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_27_id, user_id_val, 'BBQ Pineapple', 'Gegrilde ananas met kaneel. Perfect dessert of bijgerecht.', 4, 10, 15, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_27_id, ing_0_id, 1, 'stuks'),
    (gen_random_uuid(), recipe_27_id, ing_1_id, 30, 'g'),
    (gen_random_uuid(), recipe_27_id, ing_2_id, 5, 'g'),
    (gen_random_uuid(), recipe_27_id, ing_3_id, 30, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_27_id, 1, 'Ananas in plakken snijden', 10),
    (gen_random_uuid(), recipe_27_id, 2, 'Grillen op 200°C tot goudbruin', 10),
    (gen_random_uuid(), recipe_27_id, 3, 'Bestrooien met suiker en kaneel', 5);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_27_id, tag_0_id),
    (gen_random_uuid(), recipe_27_id, tag_1_id),
    (gen_random_uuid(), recipe_27_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_27_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_27_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 28: Smoked Pork Tenderloin
DO $$
DECLARE
  recipe_28_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Varkenshaas' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_28_id, user_id_val, 'Smoked Pork Tenderloin', 'Malse varkenshaas gerookt. Snel en smaakvol.', 4, 20, 90, 65, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_28_id, ing_0_id, 800, 'g'),
    (gen_random_uuid(), recipe_28_id, ing_1_id, 15, 'g'),
    (gen_random_uuid(), recipe_28_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_28_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_28_id, ing_4_id, 3, 'tenen');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_28_id, 1, 'Varkenshaas kruiden', 20),
    (gen_random_uuid(), recipe_28_id, 2, 'Roken op 120°C tot 65°C intern', 60),
    (gen_random_uuid(), recipe_28_id, 3, 'Rusten 10 minuten', 10);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_28_id, tag_0_id),
    (gen_random_uuid(), recipe_28_id, tag_1_id),
    (gen_random_uuid(), recipe_28_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_28_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_28_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 29: BBQ Shrimp Skewers
DO $$
DECLARE
  recipe_29_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Garnalen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Peterselie' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'fish' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'juicy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_29_id, user_id_val, 'BBQ Shrimp Skewers', 'Garnalen met knoflook en citroen. Snel en elegant.', 4, 20, 10, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_29_id, ing_0_id, 600, 'g'),
    (gen_random_uuid(), recipe_29_id, ing_1_id, 30, 'ml'),
    (gen_random_uuid(), recipe_29_id, ing_2_id, 4, 'tenen'),
    (gen_random_uuid(), recipe_29_id, ing_3_id, 2, 'stuks'),
    (gen_random_uuid(), recipe_29_id, ing_4_id, 10, 'g'),
    (gen_random_uuid(), recipe_29_id, ing_5_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_29_id, 1, 'Garnalen marineren in olie, knoflook en citroen', 15),
    (gen_random_uuid(), recipe_29_id, 2, 'Rijgen op spiesen', 5),
    (gen_random_uuid(), recipe_29_id, 3, 'Grillen op 200°C tot roze en krokant', 8);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_29_id, tag_0_id),
    (gen_random_uuid(), recipe_29_id, tag_1_id),
    (gen_random_uuid(), recipe_29_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_29_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_29_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 30: Smoked Beef Jerky
DO $$
DECLARE
  recipe_30_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Runderlappen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Sojasaus' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Worcestershire saus' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Liquid smoke' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'beef' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_30_id, user_id_val, 'Smoked Beef Jerky', 'Zelfgemaakte beef jerky. Perfecte snack.', 8, 30, 360, 70, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_30_id, ing_0_id, 1, 'kg'),
    (gen_random_uuid(), recipe_30_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_30_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_30_id, ing_3_id, 50, 'ml'),
    (gen_random_uuid(), recipe_30_id, ing_4_id, 30, 'ml'),
    (gen_random_uuid(), recipe_30_id, ing_5_id, 5, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_30_id, 1, 'Vlees in dunne plakken snijden', 20),
    (gen_random_uuid(), recipe_30_id, 2, 'Marineren 12-24 uur', NULL),
    (gen_random_uuid(), recipe_30_id, 3, 'Roken op 80°C tot droog en taaie textuur', 300);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_30_id, tag_0_id),
    (gen_random_uuid(), recipe_30_id, tag_1_id),
    (gen_random_uuid(), recipe_30_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_30_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_30_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 31: BBQ Stuffed Zucchini
DO $$
DECLARE
  recipe_31_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Courgettes' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Gehakt' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Ui' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Tomatenpuree' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Mozzarella' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_31_id, user_id_val, 'BBQ Stuffed Zucchini', 'Courgettes gevuld met gehakt en kaas. Compleet gerecht.', 4, 25, 40, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_31_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_31_id, ing_1_id, 400, 'g'),
    (gen_random_uuid(), recipe_31_id, ing_2_id, 1, 'stuks'),
    (gen_random_uuid(), recipe_31_id, ing_3_id, 2, 'tenen'),
    (gen_random_uuid(), recipe_31_id, ing_4_id, 30, 'g'),
    (gen_random_uuid(), recipe_31_id, ing_5_id, 150, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_31_id, 1, 'Courgettes halveren en uithollen', 15),
    (gen_random_uuid(), recipe_31_id, 2, 'Vullen met gehaktmengsel', 10),
    (gen_random_uuid(), recipe_31_id, 3, 'Grillen op 180°C tot gaar en kaas gesmolten', 35);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_31_id, tag_0_id),
    (gen_random_uuid(), recipe_31_id, tag_1_id),
    (gen_random_uuid(), recipe_31_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_31_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_31_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 32: Smoked Whole Turkey
DO $$
DECLARE
  recipe_32_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  ing_6_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Hele kalkoen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO ing_6_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'turkey' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_32_id, user_id_val, 'Smoked Whole Turkey', 'Hele kalkoen gerookt. Perfect voor Thanksgiving.', 12, 60, 360, 70, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_32_id, ing_0_id, 6, 'kg'),
    (gen_random_uuid(), recipe_32_id, ing_1_id, 50, 'g'),
    (gen_random_uuid(), recipe_32_id, ing_2_id, 25, 'g'),
    (gen_random_uuid(), recipe_32_id, ing_3_id, 20, 'g'),
    (gen_random_uuid(), recipe_32_id, ing_4_id, 15, 'g'),
    (gen_random_uuid(), recipe_32_id, ing_5_id, 10, 'g'),
    (gen_random_uuid(), recipe_32_id, ing_6_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_32_id, 1, 'Kalkoen drogen en kruiden', 60),
    (gen_random_uuid(), recipe_32_id, 2, 'Roken op 120°C tot 70°C in borst', 300),
    (gen_random_uuid(), recipe_32_id, 3, 'Rusten 30 minuten voor snijden', 30);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_32_id, tag_0_id),
    (gen_random_uuid(), recipe_32_id, tag_1_id),
    (gen_random_uuid(), recipe_32_id, tag_2_id),
    (gen_random_uuid(), recipe_32_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_32_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_32_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 33: BBQ Lamb Chops
DO $$
DECLARE
  recipe_33_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Lamsribbetjes' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Munt' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'lamb' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'juicy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_33_id, user_id_val, 'BBQ Lamb Chops', 'Lamsribbetjes met mint saus. Elegant en smaakvol.', 4, 20, 20, 60, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_33_id, ing_0_id, 1.2, 'kg'),
    (gen_random_uuid(), recipe_33_id, ing_1_id, 15, 'g'),
    (gen_random_uuid(), recipe_33_id, ing_2_id, 10, 'g'),
    (gen_random_uuid(), recipe_33_id, ing_3_id, 8, 'g'),
    (gen_random_uuid(), recipe_33_id, ing_4_id, 3, 'tenen'),
    (gen_random_uuid(), recipe_33_id, ing_5_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_33_id, 1, 'Lamsribbetjes marineren', 20),
    (gen_random_uuid(), recipe_33_id, 2, 'Grillen op 200°C tot medium-rare', 12),
    (gen_random_uuid(), recipe_33_id, 3, 'Rusten 5 minuten', 5);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_33_id, tag_0_id),
    (gen_random_uuid(), recipe_33_id, tag_1_id),
    (gen_random_uuid(), recipe_33_id, tag_2_id),
    (gen_random_uuid(), recipe_33_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_33_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_33_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 34: Smoked Pork Shoulder
DO $$
DECLARE
  recipe_34_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Pork shoulder' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'pulled-pork' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_34_id, user_id_val, 'Smoked Pork Shoulder', 'Klassieke pulled pork. Perfect voor grote groepen.', 10, 30, 600, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_34_id, ing_0_id, 4, 'kg'),
    (gen_random_uuid(), recipe_34_id, ing_1_id, 40, 'g'),
    (gen_random_uuid(), recipe_34_id, ing_2_id, 20, 'g'),
    (gen_random_uuid(), recipe_34_id, ing_3_id, 25, 'g'),
    (gen_random_uuid(), recipe_34_id, ing_4_id, 15, 'g'),
    (gen_random_uuid(), recipe_34_id, ing_5_id, 30, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_34_id, 1, 'Pork shoulder trimmen en rub aanbrengen', 30),
    (gen_random_uuid(), recipe_34_id, 2, 'Roken op 110°C met hickory', 480),
    (gen_random_uuid(), recipe_34_id, 3, 'Wrappen bij 70°C', 120),
    (gen_random_uuid(), recipe_34_id, 4, 'Rusten en pullen', 60);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_34_id, tag_0_id),
    (gen_random_uuid(), recipe_34_id, tag_1_id),
    (gen_random_uuid(), recipe_34_id, tag_2_id),
    (gen_random_uuid(), recipe_34_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_34_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_34_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 35: BBQ Stuffed Tomatoes
DO $$
DECLARE
  recipe_35_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Grote tomaten' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Risotto' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Parmezaan' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Basilicum' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_35_id, user_id_val, 'BBQ Stuffed Tomatoes', 'Tomaten gevuld met risotto en kaas. Italiaans-BBQ fusion.', 4, 30, 25, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_35_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_35_id, ing_1_id, 200, 'g'),
    (gen_random_uuid(), recipe_35_id, ing_2_id, 100, 'g'),
    (gen_random_uuid(), recipe_35_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_35_id, ing_4_id, 20, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_35_id, 1, 'Tomaten uithollen', 15),
    (gen_random_uuid(), recipe_35_id, 2, 'Vullen met risotto en kaas', 15),
    (gen_random_uuid(), recipe_35_id, 3, 'Grillen op 180°C tot zacht', 20);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_35_id, tag_0_id),
    (gen_random_uuid(), recipe_35_id, tag_1_id),
    (gen_random_uuid(), recipe_35_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_35_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_35_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 36: Smoked Venison
DO $$
DECLARE
  recipe_36_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Hertenvlees' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Jeneverbessen' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_36_id, user_id_val, 'Smoked Venison', 'Hertenvlees gerookt. Wild en smaakvol.', 6, 30, 180, 60, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_36_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_36_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_36_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_36_id, ing_3_id, 10, 'stuks'),
    (gen_random_uuid(), recipe_36_id, ing_4_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_36_id, 1, 'Vlees marineren met jeneverbessen en rozemarijn', 30),
    (gen_random_uuid(), recipe_36_id, 2, 'Roken op 120°C tot medium-rare', 120),
    (gen_random_uuid(), recipe_36_id, 3, 'Rusten 15 minuten', 15);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_36_id, tag_0_id),
    (gen_random_uuid(), recipe_36_id, tag_1_id),
    (gen_random_uuid(), recipe_36_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_36_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_36_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 37: BBQ Halloumi Skewers
DO $$
DECLARE
  recipe_37_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Halloumi' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Paprika' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Courgette' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Ui' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Oregano' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'crispy' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_37_id, user_id_val, 'BBQ Halloumi Skewers', 'Gegrilde halloumi met groenten. Vegetarisch en smaakvol.', 4, 20, 15, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_37_id, ing_0_id, 400, 'g'),
    (gen_random_uuid(), recipe_37_id, ing_1_id, 2, 'stuks'),
    (gen_random_uuid(), recipe_37_id, ing_2_id, 2, 'stuks'),
    (gen_random_uuid(), recipe_37_id, ing_3_id, 1, 'stuks'),
    (gen_random_uuid(), recipe_37_id, ing_4_id, 30, 'ml'),
    (gen_random_uuid(), recipe_37_id, ing_5_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_37_id, 1, 'Groenten en halloumi in stukken snijden', 15),
    (gen_random_uuid(), recipe_37_id, 2, 'Rijgen op spiesen', 5),
    (gen_random_uuid(), recipe_37_id, 3, 'Grillen op 200°C tot goudbruin', 12);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_37_id, tag_0_id),
    (gen_random_uuid(), recipe_37_id, tag_1_id),
    (gen_random_uuid(), recipe_37_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_37_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_37_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 38: Smoked Oysters
DO $$
DECLARE
  recipe_38_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Oesters' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Boter' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Peterselie' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'fish' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_38_id, user_id_val, 'Smoked Oysters', 'Oesters gerookt met boter en knoflook. Luxe voorgerecht.', 4, 20, 15, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_38_id, ing_0_id, 16, 'stuks'),
    (gen_random_uuid(), recipe_38_id, ing_1_id, 50, 'g'),
    (gen_random_uuid(), recipe_38_id, ing_2_id, 3, 'tenen'),
    (gen_random_uuid(), recipe_38_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_38_id, ing_4_id, 1, 'stuks');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_38_id, 1, 'Oesters openen', 15),
    (gen_random_uuid(), recipe_38_id, 2, 'Boter met knoflook smelten', 5),
    (gen_random_uuid(), recipe_38_id, 3, 'Roken op 150°C tot oesters gaar zijn', 10);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_38_id, tag_0_id),
    (gen_random_uuid(), recipe_38_id, tag_1_id),
    (gen_random_uuid(), recipe_38_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_38_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_38_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 39: BBQ Sweet Potatoes
DO $$
DECLARE
  recipe_39_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Zoete aardappelen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Boter' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Honing' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Kaneel' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'sweet' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'grilling' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_39_id, user_id_val, 'BBQ Sweet Potatoes', 'Zoete aardappelen met boter en honing. Perfect bijgerecht.', 4, 10, 45, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_39_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_39_id, ing_1_id, 50, 'g'),
    (gen_random_uuid(), recipe_39_id, ing_2_id, 40, 'ml'),
    (gen_random_uuid(), recipe_39_id, ing_3_id, 5, 'g'),
    (gen_random_uuid(), recipe_39_id, ing_4_id, 5, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_39_id, 1, 'Aardappelen wassen en prikken', 5),
    (gen_random_uuid(), recipe_39_id, 2, 'Indirect grillen op 180°C tot zacht', 40),
    (gen_random_uuid(), recipe_39_id, 3, 'Openen en serveren met boter en honing', 5);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_39_id, tag_0_id),
    (gen_random_uuid(), recipe_39_id, tag_1_id),
    (gen_random_uuid(), recipe_39_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_39_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_39_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 40: Smoked Pork Ribs St. Louis Style
DO $$
DECLARE
  recipe_40_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'St. Louis ribs' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Bruine suiker' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'ribs' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_40_id, user_id_val, 'Smoked Pork Ribs St. Louis Style', 'St. Louis cut ribs met perfecte bark. Klassiek recept.', 4, 30, 360, 88, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_40_id, ing_0_id, 2, 'racks'),
    (gen_random_uuid(), recipe_40_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_40_id, ing_2_id, 20, 'g'),
    (gen_random_uuid(), recipe_40_id, ing_3_id, 20, 'g'),
    (gen_random_uuid(), recipe_40_id, ing_4_id, 30, 'g'),
    (gen_random_uuid(), recipe_40_id, ing_5_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_40_id, 1, 'Ribs trimmen tot St. Louis cut', 20),
    (gen_random_uuid(), recipe_40_id, 2, 'Membrane verwijderen en rub aanbrengen', 10),
    (gen_random_uuid(), recipe_40_id, 3, 'Roken op 120°C met hickory', 300),
    (gen_random_uuid(), recipe_40_id, 4, 'Wrappen en 1 uur garen', 60);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_40_id, tag_0_id),
    (gen_random_uuid(), recipe_40_id, tag_1_id),
    (gen_random_uuid(), recipe_40_id, tag_2_id),
    (gen_random_uuid(), recipe_40_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_40_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_40_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 41: BBQ Portobello Burger
DO $$
DECLARE
  recipe_41_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Portobello paddenstoelen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Balsamico azijn' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Tijm' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Burger buns' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_41_id, user_id_val, 'BBQ Portobello Burger', 'Vegetarische burger van portobello paddenstoelen. Vol van smaak.', 4, 20, 20, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_41_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_41_id, ing_1_id, 40, 'ml'),
    (gen_random_uuid(), recipe_41_id, ing_2_id, 20, 'ml'),
    (gen_random_uuid(), recipe_41_id, ing_3_id, 2, 'tenen'),
    (gen_random_uuid(), recipe_41_id, ing_4_id, 5, 'g'),
    (gen_random_uuid(), recipe_41_id, ing_5_id, 4, 'stuks');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_41_id, 1, 'Paddenstoelen marineren', 15),
    (gen_random_uuid(), recipe_41_id, 2, 'Grillen op 180°C tot zacht en gesmoord', 15),
    (gen_random_uuid(), recipe_41_id, 3, 'Serveren op geroosterde buns', 5);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_41_id, tag_0_id),
    (gen_random_uuid(), recipe_41_id, tag_1_id),
    (gen_random_uuid(), recipe_41_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_41_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_41_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 42: Smoked Beef Cheeks
DO $$
DECLARE
  recipe_42_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Runderwangen' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Rode wijn' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'beef' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_42_id, user_id_val, 'Smoked Beef Cheeks', 'Runderwangen gerookt tot perfecte malsheid. Rijk en smaakvol.', 4, 30, 360, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_42_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_42_id, ing_1_id, 25, 'g'),
    (gen_random_uuid(), recipe_42_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_42_id, ing_3_id, 12, 'g'),
    (gen_random_uuid(), recipe_42_id, ing_4_id, 10, 'g'),
    (gen_random_uuid(), recipe_42_id, ing_5_id, 200, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_42_id, 1, 'Wangen trimmen en kruiden', 30),
    (gen_random_uuid(), recipe_42_id, 2, 'Roken op 110°C met post oak', 300),
    (gen_random_uuid(), recipe_42_id, 3, 'Braisen in rode wijn tot mals', 60);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_42_id, tag_0_id),
    (gen_random_uuid(), recipe_42_id, tag_1_id),
    (gen_random_uuid(), recipe_42_id, tag_2_id),
    (gen_random_uuid(), recipe_42_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_42_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_42_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 43: BBQ Asparagus
DO $$
DECLARE
  recipe_43_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Asperges' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Parmezaan' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_43_id, user_id_val, 'BBQ Asparagus', 'Asperges met citroen en parmezaan. Elegant bijgerecht.', 4, 10, 10, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_43_id, ing_0_id, 500, 'g'),
    (gen_random_uuid(), recipe_43_id, ing_1_id, 30, 'ml'),
    (gen_random_uuid(), recipe_43_id, ing_2_id, 8, 'g'),
    (gen_random_uuid(), recipe_43_id, ing_3_id, 5, 'g'),
    (gen_random_uuid(), recipe_43_id, ing_4_id, 1, 'stuks'),
    (gen_random_uuid(), recipe_43_id, ing_5_id, 50, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_43_id, 1, 'Asperges schillen en marineren', 10),
    (gen_random_uuid(), recipe_43_id, 2, 'Grillen op 200°C tot zacht maar nog knapperig', 8),
    (gen_random_uuid(), recipe_43_id, 3, 'Serveren met citroen en parmezaan', 2);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_43_id, tag_0_id),
    (gen_random_uuid(), recipe_43_id, tag_1_id),
    (gen_random_uuid(), recipe_43_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_43_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_43_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 44: Smoked Pork Loin
DO $$
DECLARE
  recipe_44_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Varkenshaas' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Rozemarijn' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Appelcider' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'tender' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_44_id, user_id_val, 'Smoked Pork Loin', 'Varkenshaas gerookt. Mals en smaakvol.', 6, 25, 120, 65, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_44_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_44_id, ing_1_id, 20, 'g'),
    (gen_random_uuid(), recipe_44_id, ing_2_id, 12, 'g'),
    (gen_random_uuid(), recipe_44_id, ing_3_id, 10, 'g'),
    (gen_random_uuid(), recipe_44_id, ing_4_id, 4, 'tenen'),
    (gen_random_uuid(), recipe_44_id, ing_5_id, 100, 'ml');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_44_id, 1, 'Varkenshaas kruiden en marineren', 25),
    (gen_random_uuid(), recipe_44_id, 2, 'Roken op 120°C tot 65°C intern', 90),
    (gen_random_uuid(), recipe_44_id, 3, 'Rusten 15 minuten', 15);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_44_id, tag_0_id),
    (gen_random_uuid(), recipe_44_id, tag_1_id),
    (gen_random_uuid(), recipe_44_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_44_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_44_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 45: BBQ Eggplant
DO $$
DECLARE
  recipe_45_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Aubergines' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Olijfolie' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Tahini' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Granaatappel' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Peterselie' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'vegetarian' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_45_id, user_id_val, 'BBQ Eggplant', 'Aubergine met tahini en granaatappel. Midden-Oosters geïnspireerd.', 4, 15, 25, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_45_id, ing_0_id, 2, 'stuks'),
    (gen_random_uuid(), recipe_45_id, ing_1_id, 40, 'ml'),
    (gen_random_uuid(), recipe_45_id, ing_2_id, 50, 'g'),
    (gen_random_uuid(), recipe_45_id, ing_3_id, 1, 'stuks'),
    (gen_random_uuid(), recipe_45_id, ing_4_id, 10, 'g'),
    (gen_random_uuid(), recipe_45_id, ing_5_id, 1, 'stuks');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_45_id, 1, 'Aubergines scoren en marineren', 10),
    (gen_random_uuid(), recipe_45_id, 2, 'Grillen op 180°C tot zacht en goudbruin', 20),
    (gen_random_uuid(), recipe_45_id, 3, 'Serveren met tahini en granaatappel', 5);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_45_id, tag_0_id),
    (gen_random_uuid(), recipe_45_id, tag_1_id),
    (gen_random_uuid(), recipe_45_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_45_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_45_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 46: Smoked Whole Fish
DO $$
DECLARE
  recipe_46_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Hele vis (zeebaars)' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Citroen' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Dille' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'fish' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_46_id, user_id_val, 'Smoked Whole Fish', 'Hele vis gerookt met citroen en kruiden. Spectaculair gerecht.', 4, 30, 60, 65, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_46_id, ing_0_id, 1.5, 'kg'),
    (gen_random_uuid(), recipe_46_id, ing_1_id, 30, 'g'),
    (gen_random_uuid(), recipe_46_id, ing_2_id, 15, 'g'),
    (gen_random_uuid(), recipe_46_id, ing_3_id, 2, 'stuks'),
    (gen_random_uuid(), recipe_46_id, ing_4_id, 15, 'g'),
    (gen_random_uuid(), recipe_46_id, ing_5_id, 3, 'tenen');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_46_id, 1, 'Vis schoonmaken en kruiden', 25),
    (gen_random_uuid(), recipe_46_id, 2, 'Vullen met citroen en dille', 5),
    (gen_random_uuid(), recipe_46_id, 3, 'Roken op 120°C tot 65°C intern', 50);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_46_id, tag_0_id),
    (gen_random_uuid(), recipe_46_id, tag_1_id),
    (gen_random_uuid(), recipe_46_id, tag_2_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_46_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_46_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 47: BBQ Stuffed Onions
DO $$
DECLARE
  recipe_47_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  ing_5_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Grote uien' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Gehakt' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Breadcrumbs' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Knoflook' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Peterselie' LIMIT 1;
  SELECT id INTO ing_5_id FROM ingredients WHERE name = 'Cheddar kaas' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'grilling' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_47_id, user_id_val, 'BBQ Stuffed Onions', 'Uien gevuld met gehakt en kaas. Comfort food op de grill.', 4, 30, 60, NULL, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_47_id, ing_0_id, 4, 'stuks'),
    (gen_random_uuid(), recipe_47_id, ing_1_id, 300, 'g'),
    (gen_random_uuid(), recipe_47_id, ing_2_id, 50, 'g'),
    (gen_random_uuid(), recipe_47_id, ing_3_id, 2, 'tenen'),
    (gen_random_uuid(), recipe_47_id, ing_4_id, 10, 'g'),
    (gen_random_uuid(), recipe_47_id, ing_5_id, 100, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_47_id, 1, 'Uien koken en uithollen', 20),
    (gen_random_uuid(), recipe_47_id, 2, 'Vullen met gehaktmengsel', 10),
    (gen_random_uuid(), recipe_47_id, 3, 'Grillen op 180°C tot gaar', 50);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_47_id, tag_0_id),
    (gen_random_uuid(), recipe_47_id, tag_1_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_47_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_47_id || '/placeholder.jpg', 'final');
END $$;

-- Recept 48: Smoked Beef Brisket Point
DO $$
DECLARE
  recipe_48_id uuid := gen_random_uuid();
  user_id_val uuid := '19d14bbb-e6f0-4bbc-bc34-ec8050a84caa';
  ing_0_id uuid;
  ing_1_id uuid;
  ing_2_id uuid;
  ing_3_id uuid;
  ing_4_id uuid;
  tag_0_id uuid;
  tag_1_id uuid;
  tag_2_id uuid;
  tag_3_id uuid;
BEGIN
  SELECT id INTO ing_0_id FROM ingredients WHERE name = 'Brisket punt' LIMIT 1;
  SELECT id INTO ing_1_id FROM ingredients WHERE name = 'Zout' LIMIT 1;
  SELECT id INTO ing_2_id FROM ingredients WHERE name = 'Zwarte peper' LIMIT 1;
  SELECT id INTO ing_3_id FROM ingredients WHERE name = 'Paprikapoeder' LIMIT 1;
  SELECT id INTO ing_4_id FROM ingredients WHERE name = 'Knoflookpoeder' LIMIT 1;
  SELECT id INTO tag_0_id FROM tags WHERE name = 'low&slow' LIMIT 1;
  SELECT id INTO tag_1_id FROM tags WHERE name = 'brisket' LIMIT 1;
  SELECT id INTO tag_2_id FROM tags WHERE name = 'smoky' LIMIT 1;
  SELECT id INTO tag_3_id FROM tags WHERE name = 'tender' LIMIT 1;
  
  INSERT INTO recipes (id, user_id, title, description, serves, prep_minutes, cook_minutes, target_internal_temp, visibility)
  VALUES (recipe_48_id, user_id_val, 'Smoked Beef Brisket Point', 'Brisket punt met extra vet. Rijk en smaakvol.', 6, 45, 480, 95, 'public');

  INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit)
  VALUES
    (gen_random_uuid(), recipe_48_id, ing_0_id, 3, 'kg'),
    (gen_random_uuid(), recipe_48_id, ing_1_id, 35, 'g'),
    (gen_random_uuid(), recipe_48_id, ing_2_id, 25, 'g'),
    (gen_random_uuid(), recipe_48_id, ing_3_id, 15, 'g'),
    (gen_random_uuid(), recipe_48_id, ing_4_id, 10, 'g');

  INSERT INTO steps (id, recipe_id, order_no, instruction, timer_minutes)
  VALUES
    (gen_random_uuid(), recipe_48_id, 1, 'Brisket punt trimmen, vetlaag behouden', 40),
    (gen_random_uuid(), recipe_48_id, 2, 'Rub aanbrengen en 12 uur marineren', NULL),
    (gen_random_uuid(), recipe_48_id, 3, 'Roken op 110°C met post oak', 420),
    (gen_random_uuid(), recipe_48_id, 4, 'Wrappen bij 70°C', 180),
    (gen_random_uuid(), recipe_48_id, 5, 'Rusten 2-4 uur', 240);

  INSERT INTO recipe_tags (id, recipe_id, tag_id)
  VALUES
    (gen_random_uuid(), recipe_48_id, tag_0_id),
    (gen_random_uuid(), recipe_48_id, tag_1_id),
    (gen_random_uuid(), recipe_48_id, tag_2_id),
    (gen_random_uuid(), recipe_48_id, tag_3_id);

  INSERT INTO photos (id, user_id, recipe_id, path, type)
  VALUES (gen_random_uuid(), user_id_val, recipe_48_id, 
    'photos/' || TO_CHAR(NOW(), 'YYYY/MM') || '/recipes/' || recipe_48_id || '/placeholder.jpg', 'final');
END $$;

