import { pgTable, uuid, text, integer, numeric, timestamp, jsonb, unique, check } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Profiles table (mirror of Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  favoriteMeat: text("favorite_meat"),
  bbqStyle: text("bbq_style"),
  experienceLevel: text("experience_level"),
  favoriteWood: text("favorite_wood"),
  bio: text("bio"),
  location: text("location"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Recipes table
export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  serves: integer("serves"),
  prepMinutes: integer("prep_minutes"),
  cookMinutes: integer("cook_minutes"),
  targetInternalTemp: integer("target_internal_temp"),
  visibility: text("visibility", { enum: ["private", "public"] }).default("private").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  defaultUnit: text("default_unit"),
});

// Recipe ingredients junction table
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id").references(() => recipes.id).notNull(),
  ingredientId: uuid("ingredient_id").references(() => ingredients.id).notNull(),
  amount: numeric("amount"),
  unit: text("unit"),
});

// Steps table
export const steps = pgTable("steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id").references(() => recipes.id).notNull(),
  orderNo: integer("order_no").notNull(),
  instruction: text("instruction").notNull(),
  timerMinutes: integer("timer_minutes"),
  targetTemp: integer("target_temp"),
});

// Photos table
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  recipeId: uuid("recipe_id").references(() => recipes.id),
  cookSessionId: uuid("cook_session_id").references(() => cookSessions.id),
  path: text("path").notNull(),
  type: text("type", { enum: ["prep", "final", "session"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Cook sessions table
export const cookSessions = pgTable("cook_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id").references(() => recipes.id).notNull(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  notes: text("notes"),
  rating: integer("rating"),
  conclusion: text("conclusion"),
  adjustments: jsonb("adjustments"),
  recipeSnapshot: jsonb("recipe_snapshot"),
});

// Session temperatures table
export const sessionTemps = pgTable("session_temps", {
  id: uuid("id").primaryKey().defaultRandom(),
  cookSessionId: uuid("cook_session_id").references(() => cookSessions.id).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  grateTemp: integer("grate_temp"),
  meatTemp: integer("meat_temp"),
  probeName: text("probe_name"),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id").references(() => recipes.id).notNull(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
});

// Recipe tags junction table
export const recipeTags = pgTable("recipe_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id").references(() => recipes.id).notNull(),
  tagId: uuid("tag_id").references(() => tags.id).notNull(),
});

// User follows table (follow relationships)
export const userFollows = pgTable("user_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").references(() => profiles.id).notNull(),
  followingId: uuid("following_id").references(() => profiles.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Recipe favorites table
export const recipeFavorites = pgTable("recipe_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  recipeId: uuid("recipe_id").references(() => recipes.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Friend requests table
export const friendRequests = pgTable("friend_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").references(() => profiles.id).notNull(),
  receiverId: uuid("receiver_id").references(() => profiles.id).notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined", "cancelled"] }).default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.requesterId, t.receiverId),
  checkNotSelf: check('requester_not_receiver', sql`"requester_id" != "receiver_id"`),
}));

// Friendships table (bidirectional)
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  friendId: uuid("friend_id").references(() => profiles.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.friendId),
  checkNotSelf: check('user_not_friend', sql`"user_id" != "friend_id"`),
}));

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  recipes: many(recipes),
  cookSessions: many(cookSessions),
  reviews: many(reviews),
  followers: many(userFollows, { relationName: "followers" }),
  following: many(userFollows, { relationName: "following" }),
  favorites: many(recipeFavorites),
  sentFriendRequests: many(friendRequests, { relationName: "requester" }),
  receivedFriendRequests: many(friendRequests, { relationName: "receiver" }),
  friendships: many(friendships, { relationName: "user" }),
  friends: many(friendships, { relationName: "friend" }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(profiles, {
    fields: [recipes.userId],
    references: [profiles.id],
  }),
  ingredients: many(recipeIngredients),
  steps: many(steps),
  photos: many(photos),
  cookSessions: many(cookSessions),
  reviews: many(reviews),
  tags: many(recipeTags),
  favorites: many(recipeFavorites),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const stepsRelations = relations(steps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [steps.recipeId],
    references: [recipes.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  recipe: one(recipes, {
    fields: [photos.recipeId],
    references: [recipes.id],
  }),
  cookSession: one(cookSessions, {
    fields: [photos.cookSessionId],
    references: [cookSessions.id],
  }),
}));

export const cookSessionsRelations = relations(cookSessions, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [cookSessions.recipeId],
    references: [recipes.id],
  }),
  user: one(profiles, {
    fields: [cookSessions.userId],
    references: [profiles.id],
  }),
  photos: many(photos),
  sessionTemps: many(sessionTemps),
}));

export const sessionTempsRelations = relations(sessionTemps, ({ one }) => ({
  cookSession: one(cookSessions, {
    fields: [sessionTemps.cookSessionId],
    references: [cookSessions.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  recipe: one(recipes, {
    fields: [reviews.recipeId],
    references: [recipes.id],
  }),
  user: one(profiles, {
    fields: [reviews.userId],
    references: [profiles.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  recipeTags: many(recipeTags),
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(tags, {
    fields: [recipeTags.tagId],
    references: [tags.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(profiles, {
    fields: [userFollows.followerId],
    references: [profiles.id],
    relationName: "followers",
  }),
  following: one(profiles, {
    fields: [userFollows.followingId],
    references: [profiles.id],
    relationName: "following",
  }),
}));

export const recipeFavoritesRelations = relations(recipeFavorites, ({ one }) => ({
  user: one(profiles, {
    fields: [recipeFavorites.userId],
    references: [profiles.id],
  }),
  recipe: one(recipes, {
    fields: [recipeFavorites.recipeId],
    references: [recipes.id],
  }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  requester: one(profiles, {
    fields: [friendRequests.requesterId],
    references: [profiles.id],
    relationName: "requester",
  }),
  receiver: one(profiles, {
    fields: [friendRequests.receiverId],
    references: [profiles.id],
    relationName: "receiver",
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(profiles, {
    fields: [friendships.userId],
    references: [profiles.id],
    relationName: "user",
  }),
  friend: one(profiles, {
    fields: [friendships.friendId],
    references: [profiles.id],
    relationName: "friend",
  }),
}));

// OCR Jobs table
export const ocrJobs = pgTable("ocr_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  photoPath: text("photo_path").notNull(),
  status: text("status", { enum: ["started", "done", "failed"] }).default("started").notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  recipeId: uuid("recipe_id").references(() => recipes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  checkStatus: check('status_check', sql`"status" IN ('started', 'done', 'failed')`),
}));

export const ocrJobsRelations = relations(ocrJobs, ({ one }) => ({
  user: one(profiles, {
    fields: [ocrJobs.userId],
    references: [profiles.id],
  }),
  recipe: one(recipes, {
    fields: [ocrJobs.recipeId],
    references: [recipes.id],
  }),
}));