#!/usr/bin/env node

/**
 * Test Database Connection Script
 * Vérifie la connexion à Supabase et affiche les tables disponibles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Test de connexion à la base de données Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Variables d'environnement Supabase manquantes");
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Définie' : '❌ Manquante');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test de connexion basique
    console.log('📡 Test de connexion...');
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);

    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      process.exit(1);
    }

    console.log('✅ Connexion réussie!\n');

    // Lister les tables publiques
    console.log('📋 Tables disponibles dans le schéma public:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Erreur lors de la récupération des tables:', tablesError.message);
    } else if (tables && tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('  Aucune table trouvée dans le schéma public');
    }

    console.log('\n🎉 Test de connexion terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection };
