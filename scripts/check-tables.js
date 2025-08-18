#!/usr/bin/env node

/**
 * Check Tables Script
 * Vérifie les tables disponibles dans Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  console.log('🔍 Vérification des tables Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Variables d'environnement Supabase manquantes");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Essayons de lister quelques tables communes
    const commonTables = ['products', 'users', 'orders', 'categories', 'cart_items'];

    console.log('📋 Vérification des tables communes:');

    for (const tableName of commonTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);

        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: Table accessible (${data ? data.length : 0} enregistrement(s) trouvé(s))`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Erreur - ${err.message}`);
      }
    }

    // Test d'authentification
    console.log("\n🔐 Test des fonctionnalités d'authentification:");
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.log('  ℹ️ Auth: Pas de session active (normal)');
      } else {
        console.log("  ✅ Auth: Service d'authentification accessible");
      }
    } catch (err) {
      console.log(`  ❌ Auth: ${err.message}`);
    }

    console.log('\n🎉 Vérification terminée!');
    console.log('💡 Pour créer des tables, utilisez le dashboard Supabase ou les migrations SQL');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkTables().catch(console.error);
}

module.exports = { checkTables };
