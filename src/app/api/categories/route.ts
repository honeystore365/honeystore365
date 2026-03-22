import { turso, generateId } from "@/lib/turso";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await turso.execute("SELECT * FROM categories ORDER BY name ASC");
    return NextResponse.json({ categories: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    const id = generateId();
    await turso.execute({
      sql: "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)",
      args: [id, name, description || null]
    });

    const result = await turso.execute({ sql: "SELECT * FROM categories WHERE id = ?", args: [id] });
    return NextResponse.json({ category: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
