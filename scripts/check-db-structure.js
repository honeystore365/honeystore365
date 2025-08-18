const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...\n');

  try {
    // Check products table
    console.log('📦 Products table:');
    const { data: products, error: productsError } = await supabase.from('products').select('*').limit(1);

    if (productsError) {
      console.error('❌ Products table error:', productsError.message);
    } else {
      console.log('✅ Products table accessible');
      if (products && products.length > 0) {
        console.log('📋 Sample product columns:', Object.keys(products[0]));
      }
    }

    // Check customers table
    console.log('\n👥 Customers table:');
    const { data: customers, error: customersError } = await supabase.from('customers').select('*').limit(1);

    if (customersError) {
      console.error('❌ Customers table error:', customersError.message);
    } else {
      console.log('✅ Customers table accessible');
      if (customers && customers.length > 0) {
        console.log('📋 Sample customer columns:', Object.keys(customers[0]));
      }
    }

    // Check addresses table
    console.log('\n📍 Addresses table:');
    const { data: addresses, error: addressesError } = await supabase.from('addresses').select('*').limit(1);

    if (addressesError) {
      console.error('❌ Addresses table error:', addressesError.message);
    } else {
      console.log('✅ Addresses table accessible');
      if (addresses && addresses.length > 0) {
        console.log('📋 Sample address columns:', Object.keys(addresses[0]));
      }
    }

    // Check orders table
    console.log('\n📋 Orders table:');
    const { data: orders, error: ordersError } = await supabase.from('orders').select('*').limit(1);

    if (ordersError) {
      console.error('❌ Orders table error:', ordersError.message);
    } else {
      console.log('✅ Orders table accessible');
      if (orders && orders.length > 0) {
        console.log('📋 Sample order columns:', Object.keys(orders[0]));
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkDatabaseStructure();
