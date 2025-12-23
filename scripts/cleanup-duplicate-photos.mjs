// Verwijder dubbele foto's met verkeerde user_id
// Run: node scripts/cleanup-duplicate-photos.mjs

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ontbreekt: ${name}`);
  return v;
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🧹 Opruimen dubbele foto\'s...\n');

  // Haal alle recepten op
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, title, user_id');

  if (recipesError) {
    console.error('❌ Error fetching recipes:', recipesError);
    process.exit(1);
  }

  console.log(`📋 ${recipes?.length || 0} recepten gevonden\n`);

  let deletedCount = 0;
  let keptCount = 0;

  // Voor elk recept: verwijder foto's met verkeerde user_id
  for (const recipe of recipes || []) {
    // Haal alle foto's op voor dit recept
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, path, user_id, created_at')
      .eq('recipe_id', recipe.id)
      .eq('type', 'final')
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error(`❌ Error fetching photos for ${recipe.title}:`, photosError);
      continue;
    }

    if (!photos || photos.length === 0) {
      continue;
    }

    // Als er meerdere foto's zijn, behoud alleen die met de juiste user_id
    if (photos.length > 1) {
      const correctPhotos = photos.filter(p => p.user_id === recipe.user_id);
      const wrongPhotos = photos.filter(p => p.user_id !== recipe.user_id);

      if (wrongPhotos.length > 0) {
        console.log(`📸 ${recipe.title}:`);
        console.log(`   ✅ Behouden: ${correctPhotos.length} foto's met juiste user_id`);
        console.log(`   🗑️  Verwijderen: ${wrongPhotos.length} foto's met verkeerde user_id`);

        // Verwijder foto's met verkeerde user_id
        for (const photo of wrongPhotos) {
          // Verwijder uit Storage
          const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([photo.path]);

          if (storageError) {
            console.error(`   ⚠️  Storage error voor ${photo.path}:`, storageError.message);
          }

          // Verwijder uit database
          const { error: deleteError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photo.id);

          if (deleteError) {
            console.error(`   ❌ Database error voor ${photo.id}:`, deleteError.message);
          } else {
            deletedCount++;
            console.log(`   ✅ Verwijderd: ${photo.path}`);
          }
        }

        keptCount += correctPhotos.length;
      } else {
        keptCount += photos.length;
      }
    } else {
      // Als er maar 1 foto is, check of user_id klopt
      if (photos[0].user_id === recipe.user_id) {
        keptCount++;
      } else {
        console.log(`⚠️  ${recipe.title}: Foto heeft verkeerde user_id, maar is enige foto. Overslaan.`);
        keptCount++;
      }
    }
  }

  console.log(`\n📊 Samenvatting:`);
  console.log(`   ✅ Behouden: ${keptCount} foto's`);
  console.log(`   🗑️  Verwijderd: ${deletedCount} foto's`);
  console.log(`\n✨ Klaar!`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

