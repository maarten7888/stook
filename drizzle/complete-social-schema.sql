-- ============================================
-- COMPLETE SOCIAL SCHEMA MIGRATION
-- ============================================
-- Dit bestand bevat alle database wijzigingen voor social features
-- Voer dit uit in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Create tables
-- ============================================

CREATE TABLE IF NOT EXISTS "recipe_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- STEP 2: Add foreign key constraints
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipe_favorites_user_id_profiles_id_fk'
    ) THEN
        ALTER TABLE "recipe_favorites" 
        ADD CONSTRAINT "recipe_favorites_user_id_profiles_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipe_favorites_recipe_id_recipes_id_fk'
    ) THEN
        ALTER TABLE "recipe_favorites" 
        ADD CONSTRAINT "recipe_favorites_recipe_id_recipes_id_fk" 
        FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_follows_follower_id_profiles_id_fk'
    ) THEN
        ALTER TABLE "user_follows" 
        ADD CONSTRAINT "user_follows_follower_id_profiles_id_fk" 
        FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_follows_following_id_profiles_id_fk'
    ) THEN
        ALTER TABLE "user_follows" 
        ADD CONSTRAINT "user_follows_following_id_profiles_id_fk" 
        FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

-- ============================================
-- STEP 3: Add unique constraints and check constraints
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_follows_unique_follower_following'
    ) THEN
        ALTER TABLE user_follows
        ADD CONSTRAINT user_follows_unique_follower_following 
        UNIQUE (follower_id, following_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_follows_no_self_follow'
    ) THEN
        ALTER TABLE user_follows
        ADD CONSTRAINT user_follows_no_self_follow 
        CHECK (follower_id != following_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'recipe_favorites_unique_user_recipe'
    ) THEN
        ALTER TABLE recipe_favorites
        ADD CONSTRAINT recipe_favorites_unique_user_recipe 
        UNIQUE (user_id, recipe_id);
    END IF;
END $$;

-- ============================================
-- STEP 4: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe ON recipe_favorites(recipe_id);

-- ============================================
-- STEP 5: Enable Row Level Security
-- ============================================

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Drop existing policies if they exist (for idempotency)
-- ============================================

DROP POLICY IF EXISTS "Users can view own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can view who follows them" ON user_follows;
DROP POLICY IF EXISTS "Anyone can view follow counts (for public profiles)" ON user_follows;
DROP POLICY IF EXISTS "Users can create own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON user_follows;

DROP POLICY IF EXISTS "Users can view own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can view favorites for accessible recipes" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON recipe_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON recipe_favorites;

-- ============================================
-- STEP 7: Create RLS policies for user_follows
-- ============================================

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

-- ============================================
-- STEP 8: Create RLS policies for recipe_favorites
-- ============================================

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

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tabellen: user_follows, recipe_favorites
-- Constraints: unique, check, foreign keys
-- Indexes: performance indexes toegevoegd
-- RLS: enabled met policies
-- ============================================

