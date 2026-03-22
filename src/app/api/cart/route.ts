import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    
    if (!customerId) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const cartResult = await turso.execute({
      sql: "SELECT * FROM carts WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1",
      args: [customerId],
    });

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const cartId = cartResult.rows[0].id as string;

    const itemsResult = await turso.execute({
      sql: `SELECT ci.*, p.name, p.price, p.image_url, p.stock 
            FROM cart_items ci 
            JOIN products p ON ci.product_id = p.id 
            WHERE ci.cart_id = ?`,
      args: [cartId],
    });

    let total = 0;
    const items = itemsResult.rows.map((row: any) => {
      const price = Number(row.price);
      const quantity = Number(row.quantity);
      total += price * quantity;
      return {
        id: row.id,
        product_id: row.product_id,
        quantity,
        name: row.name,
        price,
        image_url: row.image_url,
        stock: row.stock,
        subtotal: price * quantity,
      };
    });

    return NextResponse.json({ items, total, cartId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity = 1, customerId } = await request.json();

    if (!productId || !customerId) {
      return NextResponse.json({ error: "Product ID and Customer ID required" }, { status: 400 });
    }

    // Get or create cart
    let cartResult = await turso.execute({
      sql: "SELECT id FROM carts WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1",
      args: [customerId],
    });

    let cartId: string;
    if (cartResult.rows.length === 0) {
      const newCart = await turso.execute({
        sql: "INSERT INTO carts (id, customer_id) VALUES (lower(hex(randomblob(16))), ?) RETURNING id",
        args: [customerId],
      });
      cartId = newCart.rows[0].id as string;
    } else {
      cartId = cartResult.rows[0].id as string;
    }

    // Check if item already in cart
    const existingItem = await turso.execute({
      sql: "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
      args: [cartId, productId],
    });

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQty = Number(existingItem.rows[0].quantity) + quantity;
      await turso.execute({
        sql: "UPDATE cart_items SET quantity = ? WHERE id = ?",
        args: [newQty, existingItem.rows[0].id],
      });
    } else {
      // Add new item
      await turso.execute({
        sql: "INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (lower(hex(randomblob(16))), ?, ?, ?)",
        args: [cartId, productId, quantity],
      });
    }

    return NextResponse.json({ success: true, message: "Added to cart" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { itemId, quantity } = await request.json();
    if (!itemId || quantity < 1) {
      return NextResponse.json({ error: "Item ID and valid quantity required" }, { status: 400 });
    }

    await turso.execute({
      sql: "UPDATE cart_items SET quantity = ? WHERE id = ?",
      args: [quantity, itemId],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    await turso.execute({
      sql: "DELETE FROM cart_items WHERE id = ?",
      args: [itemId],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
