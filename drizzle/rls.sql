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
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow public read of limited profile fields (for recipe authors, reviews, etc.)
CREATE POLICY "Anyone can view public profile info" ON profiles
  FOR SELECT USING (true);

-- Friends can view full profile
CREATE POLICY "Friends can view full profile" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
         OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
    )
  );

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

-- Friends can view photos from friend's sessions
CREATE POLICY "Friends can view photos from friend's sessions" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cook_sessions
      JOIN friendships ON (
        (friendships.user_id = auth.uid() AND friendships.friend_id = cook_sessions.user_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = cook_sessions.user_id)
      )
      WHERE cook_sessions.id = photos.cook_session_id
    )
  );

-- Allow authenticated users to insert photos
-- Ownership is verified in the API layer before insert
CREATE POLICY "Authenticated users can insert photos" ON photos
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update photos for own recipes/sessions" ON photos
  FOR UPDATE USING (
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

CREATE POLICY "Users can delete photos for own recipes/sessions" ON photos
  FOR DELETE USING (
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

-- Friends can view private sessions
CREATE POLICY "Friends can view private sessions" ON cook_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = cook_sessions.user_id)
         OR (friendships.friend_id = auth.uid() AND friendships.user_id = cook_sessions.user_id)
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

-- Friends can view temps from friend's sessions
CREATE POLICY "Friends can view temps from friend's sessions" ON session_temps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cook_sessions
      JOIN friendships ON (
        (friendships.user_id = auth.uid() AND friendships.friend_id = cook_sessions.user_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = cook_sessions.user_id)
      )
      WHERE cook_sessions.id = session_temps.cook_session_id
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

-- User follows policies
CREATE POLICY "Users can view own follows" ON user_follows
  FOR SELECT USING (follower_id = auth.uid());

CREATE POLICY "Users can view who follows them" ON user_follows
  FOR SELECT USING (following_id = auth.uid());

CREATE POLICY "Anyone can view follow counts (for public profiles)" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create own follows" ON user_follows
  FOR INSERT WITH CHECK (
    follower_id = auth.uid() 
    AND follower_id != following_id
  );

CREATE POLICY "Users can delete own follows" ON user_follows
  FOR DELETE USING (follower_id = auth.uid());

-- Recipe favorites policies
CREATE POLICY "Users can view own favorites" ON recipe_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view favorites for accessible recipes" ON recipe_favorites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_favorites.recipe_id 
      AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create own favorites" ON recipe_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites" ON recipe_favorites
  FOR DELETE USING (user_id = auth.uid());

-- Friend requests policies
CREATE POLICY "Users can view own friend requests" ON friend_requests
  FOR SELECT USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests" ON friend_requests
  FOR INSERT WITH CHECK (
    requester_id = auth.uid() 
    AND requester_id != receiver_id
  );

CREATE POLICY "Users can update received friend requests" ON friend_requests
  FOR UPDATE USING (receiver_id = auth.uid());

CREATE POLICY "Users can cancel own sent requests" ON friend_requests
  FOR UPDATE USING (requester_id = auth.uid() AND status = 'pending');

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Anyone can view friendship count (for public profiles)" ON friendships
  FOR SELECT USING (true);

-- Note: Friendships are created via API/server actions after accepting friend request
-- No direct INSERT policy needed as we use service role key in API
