import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();
    
    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 });
    }

    const cartResult = await turso.execute({
      sql: "SELECT id FROM carts WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1",
      args: [customerId],
    });

    if (cartResult.rows.length > 0) {
      const cartId = cartResult.rows[0].id as string;
      await turso.execute({
        sql: "DELETE FROM cart_items WHERE cart_id = ?",
        args: [cartId],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
