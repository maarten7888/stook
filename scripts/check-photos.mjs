// Check of foto's correct in database staan
// Run: node scripts/check-photos.mjs

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

  console.log('🔍 Controleren foto\'s in database...\n');

  // Haal alle recepten op
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, title, visibility, user_id')
    .order('created_at', { ascending: true })
    .limit(5);

  if (recipesError) {
    console.error('❌ Error fetching recipes:', recipesError);
    process.exit(1);
  }

  console.log(`📋 ${recipes?.length || 0} recepten gevonden\n`);

  // Check foto's voor elk recept
  for (const recipe of recipes || []) {
    console.log(`\n📸 Recept: ${recipe.title}`);
    console.log(`   ID: ${recipe.id}`);
    console.log(`   Visibility: ${recipe.visibility}`);
    console.log(`   User ID: ${recipe.user_id}`);

    // Haal foto's op
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, path, type, user_id, created_at')
      .eq('recipe_id', recipe.id);

    if (photosError) {
      console.error(`   ❌ Error: ${photosError.message}`);
      continue;
    }

    console.log(`   📷 Foto's: ${photos?.length || 0}`);

    if (photos && photos.length > 0) {
      for (const photo of photos) {
        console.log(`      - Path: ${photo.path}`);
        console.log(`        Type: ${photo.type}`);
        console.log(`        User ID: ${photo.user_id}`);
        
        // Check of bestand bestaat in Storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('photos')
          .list(photo.path.split('/').slice(0, -1).join('/'));

        if (fileError) {
          console.log(`        ⚠️  Storage error: ${fileError.message}`);
        } else {
          const fileName = photo.path.split('/').pop();
          const exists = fileData?.some(f => f.name === fileName);
          console.log(`        ${exists ? '✅' : '❌'} Bestand in Storage: ${exists ? 'Ja' : 'Nee'}`);
        }

        // Probeer signed URL te genereren
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.path, 3600);

        if (urlError) {
          console.log(`        ❌ Signed URL error: ${urlError.message}`);
        } else {
          console.log(`        ${signedUrl?.signedUrl ? '✅' : '❌'} Signed URL: ${signedUrl?.signedUrl ? 'Gegenereerd' : 'Niet gegenereerd'}`);
        }
      }
    }
  }

  console.log('\n✨ Klaar!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

