import { turso } from "./turso";

// Generate UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Products
export async function getProducts(categoryId?: string) {
  if (categoryId) {
    const result = await turso.execute(
      "SELECT p.* FROM products p JOIN product_categories pc ON p.id = pc.product_id WHERE pc.category_id = ? AND p.is_available = 1 ORDER BY p.created_at DESC",
      [categoryId]
    );
    return result.rows;
  }
  const result = await turso.execute("SELECT * FROM products ORDER BY created_at DESC");
  return result.rows;
}

export async function getProduct(id: string) {
  const result = await turso.execute("SELECT * FROM products WHERE id = ?", [id]);
  return result.rows[0] || null;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  stock: number;
  weight?: string;
  origin?: string;
  image_url?: string;
  category_id?: string;
}) {
  const id = generateId();
  await turso.execute(
    `INSERT INTO products (id, name, description, price, stock, weight, origin, image_url, is_available, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [id, data.name, data.description || null, data.price, data.stock, data.weight || null, data.origin || null, data.image_url || null]
  );
  
  if (data.category_id) {
    await turso.execute(
      "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)",
      [id, data.category_id]
    );
  }
  
  return id;
}

export async function updateProduct(id: string, data: Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  weight: string;
  origin: string;
  image_url: string;
  is_available: number;
}>) {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) { updates.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { updates.push("description = ?"); values.push(data.description); }
  if (data.price !== undefined) { updates.push("price = ?"); values.push(data.price); }
  if (data.stock !== undefined) { updates.push("stock = ?"); values.push(data.stock); }
  if (data.weight !== undefined) { updates.push("weight = ?"); values.push(data.weight); }
  if (data.origin !== undefined) { updates.push("origin = ?"); values.push(data.origin); }
  if (data.image_url !== undefined) { updates.push("image_url = ?"); values.push(data.image_url); }
  if (data.is_available !== undefined) { updates.push("is_available = ?"); values.push(data.is_available); }
  
  if (updates.length > 0) {
    values.push(id);
    await turso.execute(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
  }
}

export async function deleteProduct(id: string) {
  await turso.execute("DELETE FROM product_categories WHERE product_id = ?", [id]);
  await turso.execute("DELETE FROM products WHERE id = ?", [id]);
}

// Categories
export async function getCategories() {
  const result = await turso.execute("SELECT * FROM categories ORDER BY name");
  return result.rows;
}

export async function createCategory(data: { name: string; description?: string }) {
  const id = generateId();
  await turso.execute(
    "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)",
    [id, data.name, data.description || null]
  );
  return id;
}

// Customers (Users)
export async function getCustomers() {
  const result = await turso.execute("SELECT * FROM customers ORDER BY created_at DESC");
  return result.rows;
}

export async function getCustomer(id: string) {
  const result = await turso.execute("SELECT * FROM customers WHERE id = ?", [id]);
  return result.rows[0] || null;
}

export async function getCustomerByEmail(email: string) {
  const result = await turso.execute("SELECT * FROM customers WHERE email = ?", [email]);
  return result.rows[0] || null;
}

export async function createCustomer(data: {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}) {
  const id = generateId();
  await turso.execute(
    `INSERT INTO customers (id, email, password_hash, first_name, last_name, phone, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, data.email, data.password_hash, data.first_name || null, data.last_name || null, data.phone || null]
  );
  return id;
}

export async function updateCustomer(id: string, data: Partial<{
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}>) {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.first_name !== undefined) { updates.push("first_name = ?"); values.push(data.first_name); }
  if (data.last_name !== undefined) { updates.push("last_name = ?"); values.push(data.last_name); }
  if (data.phone !== undefined) { updates.push("phone = ?"); values.push(data.phone); }
  if (data.address !== undefined) { updates.push("address = ?"); values.push(data.address); }
  
  if (updates.length > 0) {
    values.push(id);
    await turso.execute(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`, values);
  }
}

// Orders
export async function getOrders() {
  const result = await turso.execute(`
    SELECT o.*, c.first_name, c.last_name, c.email 
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id 
    
  `);
  return result.rows;
}

export async function getOrder(id: string) {
  const result = await turso.execute("SELECT * FROM orders WHERE id = ?", [id]);
  return result.rows[0] || null;
}

export async function getOrdersByCustomer(customerId: string) {
  const result = await turso.execute(
    "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC",
    [customerId]
  );
  return result.rows;
}

export async function createOrder(data: {
  customer_id: string;
  total_amount: number;
  status?: string;
  payment_method?: string;
  shipping_address?: string;
  phone?: string;
}) {
  const id = generateId();
  await turso.execute(
    `INSERT INTO orders (id, customer_id, total_amount, status, payment_method, shipping_address, phone, order_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, data.customer_id, data.total_amount, data.status || 'pending', data.payment_method || 'cash_on_delivery', data.shipping_address || null, data.phone || null]
  );
  return id;
}

export async function updateOrderStatus(id: string, status: string) {
  await turso.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
}

// Cart
export async function getCart(customerId: string) {
  // cart_items links directly to customer_id (no separate carts table needed for simple queries)
  return { customer_id: customerId };
}

export async function getCartItems(customerId: string) {
  const result = await turso.execute(
    `SELECT ci.*, p.name, p.price, p.image_url, p.stock 
     FROM cart_items ci 
     JOIN products p ON ci.product_id = p.id 
     WHERE ci.customer_id = ?`,
    [customerId]
  );
  return result.rows;
}

export async function addToCart(customerId: string, productId: string, quantity: number = 1) {
  await turso.execute(
    `INSERT INTO cart_items (id, customer_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(customer_id, product_id) DO UPDATE SET quantity = quantity + ?`,
    [generateId(), customerId, productId, quantity, quantity]
  );
}

export async function removeFromCart(customerId: string, productId: string) {
  await turso.execute(
    "DELETE FROM cart_items WHERE customer_id = ? AND product_id = ?",
    [customerId, productId]
  );
}

export async function clearCart(customerId: string) {
  await turso.execute("DELETE FROM cart_items WHERE customer_id = ?", [customerId]);
}

// Settings
export async function getSettings() {
  const result = await turso.execute("SELECT * FROM store_settings LIMIT 1");
  return result.rows[0] || null;
}

export async function updateSettings(data: {
  store_name?: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  delivery_fee?: number;
}) {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.store_name !== undefined) { updates.push("store_name = ?"); values.push(data.store_name); }
  if (data.store_description !== undefined) { updates.push("store_description = ?"); values.push(data.store_description); }
  if (data.contact_email !== undefined) { updates.push("contact_email = ?"); values.push(data.contact_email); }
  if (data.contact_phone !== undefined) { updates.push("contact_phone = ?"); values.push(data.contact_phone); }
  if (data.address !== undefined) { updates.push("address = ?"); values.push(data.address); }
  if (data.delivery_fee !== undefined) { updates.push("delivery_fee = ?"); values.push(data.delivery_fee); }
  
  if (updates.length > 0) {
    await turso.execute(
      `UPDATE store_settings SET ${updates.join(", ")}`,
      values
    );
  }
}

export { generateId };
