-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_temps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Anyone can view public recipes" ON recipes
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (user_id = auth.uid());

-- Ingredients policies (public read)
CREATE POLICY "Anyone can view ingredients" ON ingredients
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ingredients" ON ingredients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Recipe ingredients policies
CREATE POLICY "Anyone can view recipe ingredients for public recipes" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

CREATE POLICY "Users can view recipe ingredients for own recipes" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipe ingredients for own recipes" ON recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Steps policies
CREATE POLICY "Anyone can view steps for public recipes" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = steps.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

CREATE POLICY "Users can view steps for own recipes" ON steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = steps.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage steps for own recipes" ON steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = steps.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Photos policies
CREATE POLICY "Users can view photos for accessible recipes/sessions" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = photos.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage photos for own recipes/sessions" ON photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = photos.recipe_id 
      AND recipes.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = photos.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    )
  );

-- Cook sessions policies
CREATE POLICY "Users can view own cook sessions or public recipe sessions" ON cook_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = cook_sessions.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

CREATE POLICY "Users can manage own cook sessions" ON cook_sessions
  FOR ALL USING (user_id = auth.uid());

-- Session temps policies
CREATE POLICY "Users can view temps for accessible sessions" ON session_temps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = session_temps.cook_session_id 
      AND (
        cook_sessions.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM recipes 
          WHERE recipes.id = cook_sessions.recipe_id 
          AND recipes.visibility = 'public'
        )
      )
    )
  );

CREATE POLICY "Users can manage temps for own sessions" ON session_temps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cook_sessions 
      WHERE cook_sessions.id = session_temps.cook_session_id 
      AND cook_sessions.user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Users can view reviews for public recipes" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = reviews.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

CREATE POLICY "Users can insert reviews for public recipes they don't own" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = reviews.recipe_id 
      AND recipes.visibility = 'public'
      AND recipes.user_id != auth.uid()
    ) AND
    NOT EXISTS (
      SELECT 1 FROM reviews 
      WHERE reviews.recipe_id = reviews.recipe_id 
      AND reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (user_id = auth.uid());

-- Tags policies (public read)
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tags" ON tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Recipe tags policies
CREATE POLICY "Anyone can view recipe tags for public recipes" ON recipe_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_tags.recipe_id 
      AND recipes.visibility = 'public'
    )
  );

CREATE POLICY "Users can view recipe tags for own recipes" ON recipe_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_tags.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipe tags for own recipes" ON recipe_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_tags.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );
