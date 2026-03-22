-- HoneyStore365 Turso Database Setup (Fixed with password_hash)

-- Create tables
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    weight TEXT,
    origin TEXT,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    category_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    status TEXT DEFAULT 'pending',
    total_amount INTEGER DEFAULT 0,
    delivery_fee INTEGER DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    product_id TEXT,
    product_name TEXT,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    product_id TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    store_name TEXT DEFAULT 'HoneyStore',
    store_description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    delivery_fee INTEGER DEFAULT 0
);

-- Insert default settings if not exists
INSERT OR IGNORE INTO settings (id, store_name, delivery_fee) VALUES (1, 'HoneyStore', 0);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description, sort_order) VALUES 
    ('cat-1', 'عسل', 'منتجات العسل الطبيعي', 1),
    ('cat-2', 'تمور', 'تمور تونسية طبيعية', 2);
