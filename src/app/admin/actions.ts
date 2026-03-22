// Server Actions for HoneyStore Admin
"use server";

import { turso, generateId } from "@/lib/turso";
import { revalidatePath } from "next/cache";

// Products Actions
export async function getProducts() {
  const result = await turso.execute("SELECT * FROM products ORDER BY created_at DESC");
  return result.rows;
}

export async function getProduct(id: string) {
  const result = await turso.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
  return result.rows[0] || null;
}

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string) * 1000; // Convert to millimes
  const stock = parseInt(formData.get("stock") as string) || 0;
  const image_url = formData.get("image_url") as string;
  const weight = formData.get("weight") as string;
  const origin = formData.get("origin") as string;
  const is_available = formData.get("is_available") === "on" ? 1 : 0;

  const id = generateId();
  const created_at = new Date().toISOString();

  await turso.execute({
    sql: `INSERT INTO products (id, name, description, price, stock, image_url, is_available, weight, origin, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, description || null, price, stock, image_url || null, is_available, weight || null, origin || null, created_at],
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string) * 1000;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const image_url = formData.get("image_url") as string;
  const weight = formData.get("weight") as string;
  const origin = formData.get("origin") as string;
  const is_available = formData.get("is_available") === "on" ? 1 : 0;

  await turso.execute({
    sql: `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, is_available = ?, weight = ?, origin = ? WHERE id = ?`,
    args: [name, description || null, price, stock, image_url || null, is_available, weight || null, origin || null, id],
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await turso.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
  revalidatePath("/admin/products");
  return { success: true };
}

// Categories Actions
export async function getCategories() {
  const result = await turso.execute("SELECT * FROM categories ORDER BY sort_order ASC");
  return result.rows;
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  const id = generateId();
  const created_at = new Date().toISOString();

  await turso.execute({
    sql: "INSERT INTO categories (id, name, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [id, name, description || null, sort_order, created_at],
  });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await turso.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
  revalidatePath("/admin/categories");
  return { success: true };
}

// Orders Actions
export async function getOrders() {
  const result = await turso.execute("SELECT * FROM orders ORDER BY ordered_at DESC");
  return result.rows;
}

export async function getOrder(id: string) {
  const result = await turso.execute({ sql: "SELECT * FROM orders WHERE id = ?", args: [id] });
  return result.rows[0] || null;
}

export async function updateOrderStatus(id: string, status: string) {
  const now = new Date().toISOString();
  let sql = "UPDATE orders SET status = ?";
  const args: any[] = [status];

  if (status === "confirmed") {
    sql += ", confirmed_at = ?";
    args.push(now);
  } else if (status === "shipped") {
    sql += ", shipped_at = ?";
    args.push(now);
  } else if (status === "delivered") {
    sql += ", delivered_at = ?";
    args.push(now);
  }

  sql += " WHERE id = ?";
  args.push(id);

  await turso.execute({ sql, args });
  revalidatePath("/admin/orders");
  return { success: true };
}

// Stats
export async function getStats() {
  const products = await turso.execute("SELECT COUNT(*) as count FROM products");
  const orders = await turso.execute("SELECT COUNT(*) as count FROM orders");
  const revenue = await turso.execute("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered'");

  return {
    totalProducts: (products.rows[0] as any).count || 0,
    totalOrders: (orders.rows[0] as any).count || 0,
    revenue: ((revenue.rows[0] as any).total || 0) / 1000,
  };
}

// Settings
export async function getSettings() {
  const result = await turso.execute("SELECT * FROM store_settings LIMIT 1");
  return result.rows[0] || null;
}

export async function updateSettings(formData: FormData) {
  const store_name = formData.get("store_name") as string;
  const store_description = formData.get("store_description") as string;
  const contact_email = formData.get("contact_email") as string;
  const contact_phone = formData.get("contact_phone") as string;
  const delivery_fee = parseInt(formData.get("delivery_fee") as string) || 0;

  await turso.execute({
    sql: `UPDATE store_settings SET store_name = ?, store_description = ?, contact_email = ?, contact_phone = ?, delivery_fee = ?, updated_at = ? WHERE id = 'default'`,
    args: [store_name, store_description || null, contact_email || null, contact_phone || null, delivery_fee, new Date().toISOString()],
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
