#!/usr/bin/env tsx
/**
 * Migration script: Supabase → InstantDB
 * 
 * Usage:
 *   export SUPABASE_URL=https://xxx.supabase.co
 *   export SUPABASE_KEY=your_service_role_key
 *   export INSTANT_APP_ID=your_app_id
 *   export INSTANT_ADMIN_TOKEN=your_admin_token
 *   npx tsx scripts/migrate-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { init, id } from "@instantdb/admin";
import type { AppSchema } from "../src/instant.schema";

// Validate env vars
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const INSTANT_APP_ID = process.env.INSTANT_APP_ID!;
const INSTANT_ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

if (!INSTANT_APP_ID || !INSTANT_ADMIN_TOKEN) {
  console.error("❌ Missing INSTANT_APP_ID or INSTANT_ADMIN_TOKEN");
  console.error("   These are in your .env.local file");
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = init<AppSchema>({
  appId: INSTANT_APP_ID,
  adminToken: INSTANT_ADMIN_TOKEN,
});

// Helper to convert DT to millimes
const toMillimes = (dt: number) => Math.round(dt * 1000);

// Helper to convert Supabase timestamp to epoch ms
const toEpoch = (iso: string) => new Date(iso).getTime();

// Generate invoice number
let invoiceCounter = 1000;
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `HS${year}${month}-${String(invoiceCounter++).padStart(4, "0")}`;
};

async function migrateCategories() {
  console.log("📦 Migrating categories...");
  const { data: categories, error } = await supabase.from("categories").select("*");
  
  if (error) {
    console.error("❌ Error fetching categories:", error);
    return;
  }

  if (!categories || categories.length === 0) {
    console.log("   ℹ️ No categories to migrate");
    return;
  }

  const txs = categories.map((cat, idx) =>
    db.tx.categories[id()].create({
      name: cat.name,
      description: cat.description || undefined,
      sortOrder: idx,
    })
  );

  await db.transact(txs);
  console.log(`   ✅ Migrated ${categories.length} categories`);
}

async function migrateProducts() {
  console.log("🍯 Migrating products...");
  const { data: products, error } = await supabase
    .from("products")
    .select("*, categories:product_categories(category_id)");
  
  if (error) {
    console.error("❌ Error fetching products:", error);
    return;
  }

  if (!products || products.length === 0) {
    console.log("   ℹ️ No products to migrate");
    return;
  }

  // First create all products
  const productIdMap = new Map<string, string>(); // old_id -> new_id
  const productTxs = products.map((p) => {
    const newId = id();
    productIdMap.set(p.id, newId);
    return db.tx.products[newId].create({
      name: p.name,
      description: p.description || undefined,
      price: toMillimes(p.price),
      stock: p.stock || 0,
      isAvailable: true,
      createdAt: toEpoch(p.created_at),
    });
  });

  await db.transact(productTxs);
  console.log(`   ✅ Migrated ${products.length} products`);

  // Then fetch and link categories
  console.log("   🔗 Linking products to categories...");
  const { data: productCats } = await supabase
    .from("product_categories")
    .select("product_id, category_id");

  if (productCats && productCats.length > 0) {
    // We need to fetch Instant category IDs by name
    const { categories: instantCategories } = await db.query({ categories: {} });
    const supabaseCats = await supabase.from("categories").select("id, name");
    
    const categoryIdMap = new Map<string, string>();
    if (supabaseCats.data && instantCategories) {
      for (const sc of supabaseCats.data) {
        const match = instantCategories.find((ic) => ic.name === sc.name);
        if (match) categoryIdMap.set(sc.id, match.id);
      }
    }

    const linkTxs = productCats
      .filter((pc) => productIdMap.has(pc.product_id) && categoryIdMap.has(pc.category_id))
      .map((pc) =>
        db.tx.products[productIdMap.get(pc.product_id)!].link({
          category: categoryIdMap.get(pc.category_id)!,
        })
      );

    if (linkTxs.length > 0) {
      await db.transact(linkTxs);
      console.log(`   ✅ Linked ${linkTxs.length} product-category relations`);
    }
  }

  // Migrate product images
  console.log("   🖼️  Migrating product images...");
  const { data: images } = await supabase.from("product_images").select("*");
  
  if (images && images.length > 0) {
    const imageTxs = images
      .filter((img) => productIdMap.has(img.product_id))
      .map((img, idx) =>
        db.tx.productImages[id()].create({
          url: img.image_url,
          sortOrder: idx,
          createdAt: toEpoch(img.created_at),
        }).link({
          product: productIdMap.get(img.product_id)!,
        })
      );

    if (imageTxs.length > 0) {
      await db.transact(imageTxs);
      console.log(`   ✅ Migrated ${imageTxs.length} product images`);
    }
  }
}

async function migrateOrders() {
  console.log("📋 Migrating orders...");
  
  // Fetch all orders with related data
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers(id, first_name, last_name, email),
      order_items(id, product_id, quantity, price)
    `);
  
  if (error) {
    console.error("❌ Error fetching orders:", error);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log("   ℹ️ No orders to migrate");
    return;
  }

  // First, create $users for customers (they'll need to reset passwords)
  console.log("   👥 Creating customer accounts...");
  const { data: customers } = await supabase.from("customers").select("*");
  const customerIdMap = new Map<string, string>(); // old_id -> new_id
  
  if (customers && customers.length > 0) {
    const userTxs = customers.map((c) => {
      const newId = id();
      customerIdMap.set(c.id, newId);
      return db.tx.$users[newId].create({
        email: c.email,
        name: `${c.first_name} ${c.last_name}`.trim(),
        role: "customer",
      });
    });

    await db.transact(userTxs);
    console.log(`   ✅ Created ${customers.length} customer accounts`);
  }

  // Get product ID mappings for order items
  const { data: products } = await supabase.from("products").select("id, name");
  const { products: instantProducts } = await db.query({ 
    products: {} 
  });
  const productIdMap = new Map<string, string>();
  if (products && instantProducts) {
    for (const sp of products) {
      const match = instantProducts.find((ip) => ip.name === sp.name);
      if (match) productIdMap.set(sp.id, match.id);
    }
  }

  // Create orders
  console.log("   📦 Creating orders...");
  const orderIdMap = new Map<string, string>();
  const orderTxs = orders.map((o) => {
    const newId = id();
    orderIdMap.set(o.id, newId);
    const customer = o.customers;
    
    return db.tx.orders[newId].create({
      invoiceNumber: generateInvoiceNumber(),
      status: "delivered", // Assume delivered for old orders
      paymentMethod: "cash_on_delivery",
      paymentStatus: "paid",
      totalAmount: toMillimes(o.total_amount),
      deliveryFee: 0,
      customerName: customer ? `${customer.first_name} ${customer.last_name}`.trim() : "Unknown",
      customerEmail: customer?.email,
      addressLine1: "Unknown", // Addresses not directly linked in old schema
      city: "Unknown",
      orderedAt: toEpoch(o.order_date),
      deliveredAt: toEpoch(o.order_date),
    });
  });

  await db.transact(orderTxs);
  console.log(`   ✅ Created ${orders.length} orders`);

  // Link orders to customers and create order items
  console.log("   🔗 Linking orders and creating order items...");
  const linkAndItemTxs = [];

  for (const order of orders) {
    const newOrderId = orderIdMap.get(order.id)!;
    
    // Link to customer
    if (order.customer_id && customerIdMap.has(order.customer_id)) {
      linkAndItemTxs.push(
        db.tx.orders[newOrderId].link({
          customer: customerIdMap.get(order.customer_id)!,
        })
      );
    }

    // Create order items
    if (order.order_items && Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        if (productIdMap.has(item.product_id)) {
          linkAndItemTxs.push(
            db.tx.orderItems[id()].create({
              quantity: item.quantity,
              unitPrice: toMillimes(item.price),
              totalPrice: toMillimes(item.price * item.quantity),
            }).link({
              order: newOrderId,
              product: productIdMap.get(item.product_id)!,
            })
          );
        }
      }
    }
  }

  if (linkAndItemTxs.length > 0) {
    await db.transact(linkAndItemTxs);
    console.log(`   ✅ Linked orders and created ${linkAndItemTxs.length - orders.length} order items`);
  }
}

async function migrateStoreSettings() {
  console.log("⚙️  Migrating store settings...");
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1);

  if (settings && settings.length > 0) {
    const s = settings[0];
    await db.transact([
      db.tx.storeSettings[id()].create({
        storeName: s.store_name || "HoneyStore365",
        storeDescription: s.store_description || undefined,
        contactEmail: s.contact_email || undefined,
        contactPhone: s.contact_phone || undefined,
        address: s.address || undefined,
        taxRate: s.tax_rate || 0,
        currency: s.currency || "TND",
        deliveryFee: s.delivery_fee ? toMillimes(s.delivery_fee) : 0,
      }),
    ]);
    console.log("   ✅ Migrated store settings");
  } else {
    // Create default settings
    await db.transact([
      db.tx.storeSettings[id()].create({
        storeName: "HoneyStore365",
        currency: "TND",
        taxRate: 0,
        deliveryFee: 0,
      }),
    ]);
    console.log("   ✅ Created default store settings");
  }
}

async function main() {
  console.log("🚀 Starting migration from Supabase to InstantDB\n");

  try {
    await migrateCategories();
    await migrateProducts();
    await migrateOrders();
    await migrateStoreSettings();

    console.log("\n✨ Migration complete!");
    console.log("\n📋 Next steps:");
    console.log("   1. Verify data in Instant Console:");
    console.log("      https://instantdb.com/dash?s=main&app=" + INSTANT_APP_ID);
    console.log("   2. Set your admin role in the console");
    console.log("   3. Update your .env.local with the Instant app credentials");
    console.log("   4. Run 'npm run dev' to start the new admin dashboard");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
