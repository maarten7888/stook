// Upload echte BBQ foto's voor alle recepten
// Run: node scripts/upload-recipe-photos.mjs
// Vereist: SUPABASE_SERVICE_ROLE_KEY en NEXT_PUBLIC_SUPABASE_URL

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Load environment variables from .env.local
config({ path: '.env.local' });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ontbreekt: ${name}`);
  return v;
}

// Bepaal relevante BBQ keywords gebaseerd op recept data
function getBBQKeywords(recipe) {
  const { title, description, ingredients, tags } = recipe;
  const lowerTitle = title.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  
  // Verzamel keywords uit verschillende bronnen
  const keywords = [];
  
  // 1. Hoofdingrediënt uit titel
  const mainIngredients = [
    'brisket', 'ribs', 'ribbetjes', 'chicken', 'kip', 'pork', 'varken',
    'salmon', 'zalm', 'beef', 'rund', 'lamb', 'lam', 'turkey', 'kalkoen',
    'sausage', 'worst', 'wings', 'burger', 'fish', 'vis', 'duck', 'eend',
    'ham', 'ham', 'tuna', 'tonijn', 'mackerel', 'makreel', 'shrimp', 'garnalen',
    'oysters', 'oesters', 'venison', 'hert', 'cauliflower', 'bloemkool',
    'portobello', 'mushrooms', 'paddenstoelen', 'peppers', 'paprika',
    'pineapple', 'ananas', 'corn', 'maïs', 'zucchini', 'courgette',
    'tomatoes', 'tomaten', 'onions', 'uien', 'asparagus', 'asperges',
    'eggplant', 'aubergine', 'sweet potatoes', 'zoete aardappelen'
  ];
  
  for (const ing of mainIngredients) {
    if (lowerTitle.includes(ing) || lowerDesc.includes(ing)) {
      keywords.push(ing);
      break; // Neem eerste match
    }
  }
  
  // 2. Voeg hoofdingrediënten toe uit ingredientenlijst
  if (ingredients && ingredients.length > 0) {
    const mainIngNames = ingredients
      .map(ing => {
        const name = (ing.ingredients?.name || ing.name || '').toLowerCase();
        // Filter alleen belangrijke ingrediënten (geen zout, peper, etc.)
        const skipWords = ['zout', 'salt', 'peper', 'pepper', 'paprikapoeder', 'paprika powder',
          'knoflookpoeder', 'garlic powder', 'uienpoeder', 'onion powder', 'olijfolie', 'olive oil',
          'boter', 'butter', 'azijn', 'vinegar', 'saus', 'sauce'];
        if (skipWords.some(word => name.includes(word))) return null;
        
        // Neem eerste 2 belangrijke ingrediënten
        const important = ['brisket', 'ribs', 'chicken', 'pork', 'beef', 'lamb', 'salmon', 'turkey',
          'duck', 'ham', 'tuna', 'mackerel', 'shrimp', 'oysters', 'venison'];
        if (important.some(word => name.includes(word))) return name.split(' ')[0];
        return null;
      })
      .filter(Boolean)
      .slice(0, 2);
    
    keywords.push(...mainIngNames);
  }
  
  // 3. Voeg tags toe
  if (tags && tags.length > 0) {
    const tagNames = tags
      .map(tag => {
        const name = (tag.tags?.name || tag.name || '').toLowerCase();
        // Relevante tags voor image search
        const relevantTags = ['low&slow', 'smoky', 'grilled', 'roasted', 'smoked', 'tender', 'crispy'];
        if (relevantTags.some(t => name.includes(t))) return name;
        return null;
      })
      .filter(Boolean)
      .slice(0, 2);
    
    keywords.push(...tagNames);
  }
  
  // 4. Voeg cooking method toe uit titel/beschrijving
  if (lowerTitle.includes('smoked') || lowerDesc.includes('smoked') || lowerDesc.includes('roken')) {
    keywords.push('smoked');
  } else if (lowerTitle.includes('grilled') || lowerDesc.includes('grilled') || lowerDesc.includes('grillen')) {
    keywords.push('grilled');
  } else if (lowerTitle.includes('roasted') || lowerDesc.includes('roasted') || lowerDesc.includes('roosteren')) {
    keywords.push('roasted');
  }
  
  // 5. Voeg altijd BBQ toe
  keywords.unshift('bbq');
  
  // 6. Voeg specifieke style keywords toe
  if (lowerTitle.includes('texas') || lowerTitle.includes('texas style')) {
    keywords.push('texas');
  }
  if (lowerTitle.includes('kansas city') || lowerTitle.includes('kansas')) {
    keywords.push('kansas city');
  }
  if (lowerTitle.includes('memphis') || lowerTitle.includes('memphis style')) {
    keywords.push('memphis');
  }
  if (lowerTitle.includes('carolina') || lowerTitle.includes('carolina style')) {
    keywords.push('carolina');
  }
  if (lowerTitle.includes('st. louis') || lowerTitle.includes('st louis')) {
    keywords.push('st louis');
  }
  
  // Verwijder duplicaten en maak unieke lijst
  const uniqueKeywords = [...new Set(keywords)].filter(Boolean);
  
  // Combineer tot search query (max 5 keywords voor betere resultaten)
  return uniqueKeywords.slice(0, 5).join(',');
}

async function downloadBBQImage(keywords, width = 800, height = 600) {
  // Probeer verschillende services voor betere betrouwbaarheid
  // Gebruik specifieke keywords voor betere resultaten
  const searchQuery = keywords.replace(/,/g, ',');
  
  const urls = [
    // Unsplash Source (gratis, geen API key nodig) - gebruik specifieke keywords
    `https://source.unsplash.com/${width}x${height}/?${searchQuery}`,
    // Probeer ook zonder komma's (spaties)
    `https://source.unsplash.com/${width}x${height}/?${searchQuery.replace(/,/g, ' ')}`,
    // Picsum als fallback (minder specifiek)
    `https://picsum.photos/seed/${encodeURIComponent(searchQuery)}/${width}/${height}`,
    // Placeholder service als laatste fallback
    `https://placehold.co/${width}x${height}/FF6A2A/ffffff?text=BBQ+Recipe`,
  ];

  for (const url of urls) {
    try {
      // Timeout implementatie voor betere compatibiliteit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/jpeg,image/png,image/webp,*/*'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        continue; // Probeer volgende URL
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Check of we daadwerkelijk een image hebben (minimaal 1KB)
      if (buffer.length > 1024) {
        return buffer;
      }
    } catch (error) {
      // Probeer volgende URL
      continue;
    }
  }
  
  return null;
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

  console.log('📸 Foto upload script gestart...\n');

  // Haal alle recepten op met volledige data (inclusief ingrediënten en tags)
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select(`
      id,
      title,
      description,
      user_id,
      recipe_ingredients(
        ingredients(name)
      ),
      recipe_tags(
        tags(name)
      )
    `)
    .order('created_at', { ascending: true });

  if (recipesError) {
    console.error('❌ Error fetching recipes:', recipesError);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log('⚠️  Geen recepten gevonden. Voer eerst het SQL script uit.');
    process.exit(0);
  }

  console.log(`📋 ${recipes.length} recepten gevonden\n`);

  // Haal alle foto's op voor recepten (we vervangen alle bestaande foto's)
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('id, recipe_id, path, user_id')
    .eq('type', 'final')
    .not('recipe_id', 'is', null);

  if (photosError) {
    console.error('❌ Error fetching photos:', photosError);
    process.exit(1);
  }

  // We gebruiken de user_id van het recept zelf, niet een willekeurige profile

  const photosByRecipe = {};
  if (photos) {
    photos.forEach(photo => {
      if (photo.recipe_id) {
        photosByRecipe[photo.recipe_id] = photo;
      }
    });
  }

  console.log(`📷 ${photos ? photos.length : 0} placeholder foto's gevonden\n`);

  let successCount = 0;
  let errorCount = 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Upload foto's voor elk recept
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];

    // Als er geen photo record is, maak er een aan
    let photo = photosByRecipe[recipe.id];
    let isNewPhoto = false;
    
    if (!photo) {
      // Maak nieuw photo record aan met de user_id van het recept
      const { data: newPhoto, error: createError } = await supabase
        .from('photos')
        .insert({
          user_id: recipe.user_id, // Gebruik user_id van het recept
          recipe_id: recipe.id,
          path: 'placeholder', // Tijdelijk, wordt later geüpdatet
          type: 'final'
        })
        .select()
        .single();
      
      if (createError || !newPhoto) {
        console.error(`❌ [${i + 1}/${recipes.length}] ${recipe.title} - Kan photo record niet aanmaken:`, createError?.message);
        errorCount++;
        continue;
      }
      
      photo = newPhoto;
      isNewPhoto = true;
      console.log(`📝 [${i + 1}/${recipes.length}] ${recipe.title} - Nieuw photo record aangemaakt`);
    }

    try {
      // Bereid recept data voor
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.recipe_ingredients || [],
        tags: recipe.recipe_tags || []
      };
      
      const keywords = getBBQKeywords(recipeData);
      console.log(`📥 [${i + 1}/${recipes.length}] ${recipe.title} - Downloaden foto (keywords: ${keywords})...`);
      
      // Download relevante BBQ foto gebaseerd op volledige recept data
      const imageBuffer = await downloadBBQImage(keywords);

      if (!imageBuffer) {
        console.log(`⚠️  [${i + 1}/${recipes.length}] ${recipe.title} - Download gefaald, overslaan`);
        errorCount++;
        continue;
      }

      // Verwijder oude foto uit Storage (als die bestaat)
      if (photo.path && photo.path !== 'placeholder' && !photo.path.includes('placeholder')) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('photos')
            .remove([photo.path]);
          
          if (deleteError) {
            console.log(`   ⚠️  Kon oude foto niet verwijderen: ${deleteError.message}`);
          } else {
            console.log(`   🗑️  Oude foto verwijderd: ${photo.path}`);
          }
        } catch (err) {
          // Negeer fouten bij verwijderen oude foto
        }
      }

      // Genereer nieuw pad
      const fileName = `${randomUUID()}.jpg`;
      const newPath = `photos/${year}/${month}/recipes/${recipe.id}/${fileName}`;

      // Upload naar Supabase Storage
      console.log(`⬆️  [${i + 1}/${recipes.length}] ${recipe.title} - Uploaden naar Storage...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(newPath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error(`❌ [${i + 1}/${recipes.length}] ${recipe.title} - Upload error:`, uploadError.message);
        errorCount++;
        continue;
      }

      // Update photo record met nieuw pad
      const { error: updateError } = await supabase
        .from('photos')
        .update({ path: newPath })
        .eq('id', photo.id);

      if (updateError) {
        console.error(`❌ [${i + 1}/${recipes.length}] ${recipe.title} - Update error:`, updateError.message);
        errorCount++;
        continue;
      }

      console.log(`✅ [${i + 1}/${recipes.length}] ${recipe.title} - Foto geüpload: ${newPath}`);
      successCount++;

      // Delay om rate limiting te voorkomen (1 seconde tussen uploads)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ [${i + 1}/${recipes.length}] ${recipe.title} - Error:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Samenvatting:`);
  console.log(`   ✅ Succesvol: ${successCount}`);
  console.log(`   ❌ Gefaald: ${errorCount}`);
  console.log(`   📋 Totaal: ${recipes.length}`);
  console.log(`\n✨ Klaar!`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

