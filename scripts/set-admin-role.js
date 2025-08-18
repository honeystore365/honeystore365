const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setAdminRole() {
  try {
    const adminEmail = 'honeystore365@gmail.com';

    console.log(`🔍 Recherche de l'utilisateur: ${adminEmail}`);

    // Récupérer l'utilisateur par email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', getUserError);
      return;
    }

    const user = users.users.find(u => u.email === adminEmail);

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${adminEmail}`);
      console.log('📋 Utilisateurs disponibles:');
      users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (${user.id})`);
    console.log('📋 Métadonnées actuelles:');
    console.log('  user_metadata:', user.user_metadata);
    console.log('  app_metadata:', user.app_metadata);

    // Mettre à jour les métadonnées utilisateur pour définir le rôle admin
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'admin',
      },
      app_metadata: {
        ...user.app_metadata,
        role: 'admin',
      },
    });

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      return;
    }

    console.log('✅ Rôle admin défini avec succès!');
    console.log('📋 Nouvelles métadonnées:');
    console.log('  user_metadata:', updatedUser.user.user_metadata);
    console.log('  app_metadata:', updatedUser.user.app_metadata);

    // Vérifier aussi dans la table customers si elle existe
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.warn('⚠️ Erreur lors de la vérification de la table customers:', customerError);
    } else if (customer) {
      console.log('📋 Données client existantes:', customer);

      // Mettre à jour le rôle dans la table customers si elle a une colonne role
      const { error: updateCustomerError } = await supabase
        .from('customers')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updateCustomerError) {
        console.warn('⚠️ Impossible de mettre à jour le rôle dans la table customers:', updateCustomerError);
      } else {
        console.log('✅ Rôle mis à jour dans la table customers');
      }
    }
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

setAdminRole();
