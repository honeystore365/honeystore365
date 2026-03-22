import { NextResponse } from "next/server";
import { turso } from "@/lib/turso";

export async function GET() {
  try {
    // Create password_reset_codes table if not exists
    await turso.execute({
      sql: `CREATE TABLE IF NOT EXISTS password_reset_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    });
    
    return NextResponse.json({ success: true, message: "Table created/verified" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
