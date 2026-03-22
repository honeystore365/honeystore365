import { turso, generateId } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await turso.execute("SELECT * FROM products ORDER BY created_at DESC");
    return NextResponse.json({ products: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, stock, weight, origin, image_url, is_available, category_id } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "الاسم والسعر مطلوبان" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO products (id, name, description, price, stock, weight, origin, image_url, is_available, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, description || null, price, stock || 0, weight || null, origin || null, image_url || null, is_available ? 1 : 0, now]
    });

    // Add category if provided
    if (category_id) {
      await turso.execute({
        sql: "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)",
        args: [id, category_id]
      });
    }

    const result = await turso.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, price, stock, weight, origin, image_url, is_available, category_id } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    await turso.execute({
      sql: `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, weight = ?, origin = ?, image_url = ?, is_available = ? WHERE id = ?`,
      args: [name, description || null, price, stock || 0, weight || null, origin || null, image_url || null, is_available ? 1 : 0, id]
    });

    // Update category if provided
    if (category_id) {
      await turso.execute({ sql: "DELETE FROM product_categories WHERE product_id = ?", args: [id] });
      await turso.execute({ sql: "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", args: [id, category_id] });
    }

    const result = await turso.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    await turso.execute({ sql: "DELETE FROM product_categories WHERE product_id = ?", args: [id] });
    await turso.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
