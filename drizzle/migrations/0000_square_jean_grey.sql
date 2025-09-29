CREATE TABLE "cook_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"notes" text,
	"rating" integer,
	"conclusion" text,
	"adjustments" jsonb,
	"recipe_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"default_unit" text,
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid,
	"cook_session_id" uuid,
	"path" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"favorite_meat" text,
	"bbq_style" text,
	"experience_level" text,
	"favorite_wood" text,
	"bio" text,
	"location" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"amount" numeric,
	"unit" text
);
--> statement-breakpoint
CREATE TABLE "recipe_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"serves" integer,
	"prep_minutes" integer,
	"cook_minutes" integer,
	"target_internal_temp" integer,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_temps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cook_session_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"grate_temp" integer,
	"meat_temp" integer,
	"probe_name" text
);
--> statement-breakpoint
CREATE TABLE "steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"order_no" integer NOT NULL,
	"instruction" text NOT NULL,
	"timer_minutes" integer,
	"target_temp" integer
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "cook_sessions" ADD CONSTRAINT "cook_sessions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cook_sessions" ADD CONSTRAINT "cook_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_cook_session_id_cook_sessions_id_fk" FOREIGN KEY ("cook_session_id") REFERENCES "public"."cook_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_temps" ADD CONSTRAINT "session_temps_cook_session_id_cook_sessions_id_fk" FOREIGN KEY ("cook_session_id") REFERENCES "public"."cook_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Add unique constraints
ALTER TABLE "reviews" ADD CONSTRAINT "unique_user_recipe" UNIQUE("recipe_id", "user_id");--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "unique_recipe_tag" UNIQUE("recipe_id", "tag_id");--> statement-breakpoint
-- Add check constraints
ALTER TABLE "recipes" ADD CONSTRAINT "visibility_check" CHECK (visibility IN ('private', 'public'));--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "type_check" CHECK (type IN ('prep', 'final', 'session'));--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "rating_check" CHECK (rating >= 1 AND rating <= 5);--> statement-breakpoint
-- Enable RLS
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cook_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session_temps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recipe_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);--> statement-breakpoint
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);--> statement-breakpoint
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);--> statement-breakpoint
CREATE POLICY "Users can view public recipes or own recipes" ON recipes FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Anyone can view ingredients" ON ingredients FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "Authenticated users can insert ingredients" ON ingredients FOR INSERT WITH CHECK (auth.role() = 'authenticated');--> statement-breakpoint
CREATE POLICY "Users can view recipe ingredients for accessible recipes" ON recipe_ingredients FOR SELECT USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())));--> statement-breakpoint
CREATE POLICY "Users can manage recipe ingredients for own recipes" ON recipe_ingredients FOR ALL USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can view steps for accessible recipes" ON steps FOR SELECT USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = steps.recipe_id AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())));--> statement-breakpoint
CREATE POLICY "Users can manage steps for own recipes" ON steps FOR ALL USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = steps.recipe_id AND recipes.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can view photos for accessible recipes/sessions" ON photos FOR SELECT USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = photos.recipe_id AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())) OR EXISTS (SELECT 1 FROM cook_sessions WHERE cook_sessions.id = photos.cook_session_id AND cook_sessions.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can manage photos for own recipes/sessions" ON photos FOR ALL USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = photos.recipe_id AND recipes.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM cook_sessions WHERE cook_sessions.id = photos.cook_session_id AND cook_sessions.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can view own cook sessions or public recipe sessions" ON cook_sessions FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM recipes WHERE recipes.id = cook_sessions.recipe_id AND recipes.visibility = 'public'));--> statement-breakpoint
CREATE POLICY "Users can manage own cook sessions" ON cook_sessions FOR ALL USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Users can view temps for accessible sessions" ON session_temps FOR SELECT USING (EXISTS (SELECT 1 FROM cook_sessions WHERE cook_sessions.id = session_temps.cook_session_id AND (cook_sessions.user_id = auth.uid() OR EXISTS (SELECT 1 FROM recipes WHERE recipes.id = cook_sessions.recipe_id AND recipes.visibility = 'public'))));--> statement-breakpoint
CREATE POLICY "Users can manage temps for own sessions" ON session_temps FOR ALL USING (EXISTS (SELECT 1 FROM cook_sessions WHERE cook_sessions.id = session_temps.cook_session_id AND cook_sessions.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can view reviews for public recipes" ON reviews FOR SELECT USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = reviews.recipe_id AND recipes.visibility = 'public'));--> statement-breakpoint
CREATE POLICY "Users can insert reviews for public recipes they don't own" ON reviews FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = reviews.recipe_id AND recipes.visibility = 'public' AND recipes.user_id != auth.uid()) AND NOT EXISTS (SELECT 1 FROM reviews WHERE reviews.recipe_id = reviews.recipe_id AND reviews.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "Authenticated users can insert tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');--> statement-breakpoint
CREATE POLICY "Users can view recipe tags for accessible recipes" ON recipe_tags FOR SELECT USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND (recipes.visibility = 'public' OR recipes.user_id = auth.uid())));--> statement-breakpoint
CREATE POLICY "Users can manage recipe tags for own recipes" ON recipe_tags FOR ALL USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()));