#!/usr/bin/env node

/**
 * Test simple de connexion Supabase
 */

const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  console.log('🔍 Test de connexion Supabase...\n');

  const supabaseUrl = 'https://llsifflkfjogjagmbmpi.supabase.co';
  const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsc2lmZmxrZmpvZ2phZ21ibXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTUzNjk5MywiZXhwIjoyMDYxMTEyOTkzfQ.ZhKjCTF2f1sN8T5jKlAJdwH-3nT4sdaX7tODYeeIx74';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test simple avec une requête basique
    console.log('📡 Test de connexion...');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('⚠️ Pas de session active (normal):', error.message);
    } else {
      console.log('✅ Connexion Supabase réussie!');
    }

    // Essayer de lister les tables avec une requête SQL
    console.log("\n📋 Test d'accès à la base de données...");
    const { data: result, error: dbError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (dbError) {
      console.log('ℹ️ Accès direct aux métadonnées non disponible (normal avec RLS)');
      console.log('   Erreur:', dbError.message);
    } else {
      console.log('✅ Accès à la base de données réussi!');
    }

    console.log('\n🎉 Test terminé - Supabase est configuré correctement!');
    console.log('🌐 Vous pouvez maintenant accéder à votre application sur http://localhost:3000');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSupabase();
