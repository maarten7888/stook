const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...\n');

  // Check environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL'
  ];

  console.log('📋 Environment variables:');
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && !value.includes('your_') && !value.includes('[YOUR-')) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${varName}: Not set or placeholder value`);
      allVarsPresent = false;
    }
  });

  if (!allVarsPresent) {
    console.log('\n❌ Please set all environment variables in .env.local');
    return;
  }

  // Test Supabase client
  try {
    console.log('\n🔗 Testing Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase client test failed:', error.message);
    } else {
      console.log('✅ Supabase client working');
    }
  } catch (error) {
    console.log('❌ Supabase client test failed:', error.message);
  }

  // Test service role client
  try {
    console.log('\n🔐 Testing service role client...');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin.from('profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Service role client test failed:', error.message);
    } else {
      console.log('✅ Service role client working');
    }
  } catch (error) {
    console.log('❌ Service role client test failed:', error.message);
  }

  console.log('\n🎯 Next steps:');
  console.log('1. Run: pnpm drizzle-kit push');
  console.log('2. Apply RLS policies in Supabase SQL Editor');
  console.log('3. Create "photos" storage bucket');
  console.log('4. Test with: node test-db.js');
}

verifySetup();
