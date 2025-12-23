// Script om de laatste 30 recepten van een gebruiker te verwijderen
// Vereist: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Gebruik: node scripts/delete-last-recipes.mjs

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ontbreekt: ${name}`);
  return v;
}

const USER_ID = "19d14bbb-e6f0-4bbc-bc34-ec8050a84caa";
const LIMIT = 30;

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log(`🔍 Zoeken naar laatste ${LIMIT} recepten voor gebruiker ${USER_ID}...`);
    
    // Haal de laatste 30 recepten op (gesorteerd op created_at DESC)
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, title, created_at')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    if (recipesError) {
      throw new Error(`Fout bij ophalen recepten: ${recipesError.message}`);
    }

    if (!recipes || recipes.length === 0) {
      console.log("❌ Geen recepten gevonden voor deze gebruiker.");
      return;
    }

    console.log(`📋 ${recipes.length} recepten gevonden:`);
    recipes.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title} (${r.id}) - ${new Date(r.created_at).toLocaleString('nl-NL')}`);
    });

    const recipeIds = recipes.map(r => r.id);
    console.log(`\n🗑️  Verwijderen van gerelateerde records...`);

    // Verwijder in de juiste volgorde (rekening houdend met foreign keys)
    
    // 1. Haal eerst cook_session IDs op voor deze recepten
    const { data: cookSessions, error: sessionsError } = await supabase
      .from('cook_sessions')
      .select('id')
      .in('recipe_id', recipeIds);

    if (sessionsError) {
      throw new Error(`Fout bij ophalen cook_sessions: ${sessionsError.message}`);
    }

    const cookSessionIds = cookSessions?.map(s => s.id) || [];

    // 2. session_temps (via cook_sessions)
    if (cookSessionIds.length > 0) {
      const { data: sessionTempsData, error: sessionTempsError } = await supabase
        .from('session_temps')
        .delete()
        .in('cook_session_id', cookSessionIds)
        .select();

      if (sessionTempsError) {
        throw new Error(`Fout bij verwijderen session_temps: ${sessionTempsError.message}`);
      }
      console.log(`   ✓ ${sessionTempsData?.length || 0} session_temps verwijderd`);
    } else {
      console.log(`   ✓ 0 session_temps verwijderd (geen cook_sessions)`);
    }

    // 3. photos (die verwijzen naar cook_sessions of recipes)
    // Verwijder eerst photos met recipe_id
    const { data: photosRecipeData, error: photosRecipeError } = await supabase
      .from('photos')
      .delete()
      .in('recipe_id', recipeIds)
      .select();

    if (photosRecipeError) {
      throw new Error(`Fout bij verwijderen photos (recipe): ${photosRecipeError.message}`);
    }

    // Verwijder dan photos met cook_session_id
    let photosSessionData = [];
    if (cookSessionIds.length > 0) {
      const { data, error: photosSessionError } = await supabase
        .from('photos')
        .delete()
        .in('cook_session_id', cookSessionIds)
        .select();

      if (photosSessionError) {
        throw new Error(`Fout bij verwijderen photos (session): ${photosSessionError.message}`);
      }
      photosSessionData = data || [];
    }

    const totalPhotos = (photosRecipeData?.length || 0) + photosSessionData.length;

    console.log(`   ✓ ${totalPhotos} photos verwijderd`);

    // 4. cook_sessions
    if (cookSessionIds.length > 0) {
      const { data: cookSessionsData, error: cookSessionsError } = await supabase
        .from('cook_sessions')
        .delete()
        .in('id', cookSessionIds)
        .select();

      if (cookSessionsError) {
        throw new Error(`Fout bij verwijderen cook_sessions: ${cookSessionsError.message}`);
      }
      console.log(`   ✓ ${cookSessionsData?.length || 0} cook_sessions verwijderd`);
    } else {
      console.log(`   ✓ 0 cook_sessions verwijderd`);
    }

    // 5. recipe_favorites
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('recipe_favorites')
      .delete()
      .in('recipe_id', recipeIds)
      .select();

    if (favoritesError) {
      throw new Error(`Fout bij verwijderen recipe_favorites: ${favoritesError.message}`);
    }
    console.log(`   ✓ ${favoritesData?.length || 0} recipe_favorites verwijderd`);

    // 6. reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .in('recipe_id', recipeIds)
      .select();

    if (reviewsError) {
      throw new Error(`Fout bij verwijderen reviews: ${reviewsError.message}`);
    }
    console.log(`   ✓ ${reviewsData?.length || 0} reviews verwijderd`);

    // 7. recipe_tags
    const { data: recipeTagsData, error: recipeTagsError } = await supabase
      .from('recipe_tags')
      .delete()
      .in('recipe_id', recipeIds)
      .select();

    if (recipeTagsError) {
      throw new Error(`Fout bij verwijderen recipe_tags: ${recipeTagsError.message}`);
    }
    console.log(`   ✓ ${recipeTagsData?.length || 0} recipe_tags verwijderd`);

    // 8. recipe_ingredients
    const { data: recipeIngredientsData, error: recipeIngredientsError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .in('recipe_id', recipeIds)
      .select();

    if (recipeIngredientsError) {
      throw new Error(`Fout bij verwijderen recipe_ingredients: ${recipeIngredientsError.message}`);
    }
    console.log(`   ✓ ${recipeIngredientsData?.length || 0} recipe_ingredients verwijderd`);

    // 9. steps
    const { data: stepsData, error: stepsError } = await supabase
      .from('steps')
      .delete()
      .in('recipe_id', recipeIds)
      .select();

    if (stepsError) {
      throw new Error(`Fout bij verwijderen steps: ${stepsError.message}`);
    }
    console.log(`   ✓ ${stepsData?.length || 0} steps verwijderd`);

    // 10. recipes (als laatste)
    const { data: recipesData, error: recipesDeleteError } = await supabase
      .from('recipes')
      .delete()
      .in('id', recipeIds)
      .select();

    if (recipesDeleteError) {
      throw new Error(`Fout bij verwijderen recipes: ${recipesDeleteError.message}`);
    }
    console.log(`   ✓ ${recipesData?.length || 0} recipes verwijderd`);

    console.log(`\n✅ Succesvol verwijderd: ${recipesData?.length || 0} recepten en alle gerelateerde records!`);

  } catch (error) {
    console.error("❌ Fout bij verwijderen:", error);
    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
