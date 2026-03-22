-- HoneyStore365 Turso Database Setup
-- Run with: npx tsx scripts/setup.ts

-- Drop existing tables
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS store_settings;

-- Categories table
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Products table - category_id is NOW REQUIRED (NOT NULL)
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- stored in millimes
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    weight TEXT,
    origin TEXT,
    category_id TEXT NOT NULL, -- REQUIRED - each product must have a category
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Orders table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address TEXT,
    city TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash_on_delivery',
    notes TEXT,
    ordered_at TEXT DEFAULT (datetime('now')),
    confirmed_at TEXT,
    shipped_at TEXT,
    delivered_at TEXT
);

-- Order Items
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Store Settings
CREATE TABLE store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT DEFAULT 'HoneyStore Tunisia',
    store_description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    delivery_fee INTEGER DEFAULT 8000,
    logo_url TEXT,
    banner_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed data
INSERT INTO categories (id, name, description, sort_order) VALUES 
    ('cat-miel', 'عسل طبيعي', 'عسل طبيعي 100% من تونس', 1),
    ('cat-dattes', 'تمور', 'تمور tunisienne premium', 2),
    ('cat-cream', 'كريمات العسل', 'كريمات طبيعية للعناية بالبشرة', 3),
    ('cat-propolis', 'propylis', 'منتجات propolis الطبيعية', 4),
    ('cat-gift', 'هدايا', 'صناديق هدايا العسل', 5);

INSERT INTO store_settings (id, store_name, store_description, contact_email, contact_phone, delivery_fee)
VALUES ('default', 'HoneyStore Tunisia', 'أفضل العسل الطبيعي والمنتجات التونسية', 'contact@honeystore.tn', '+216 50 000 000', 8000);
