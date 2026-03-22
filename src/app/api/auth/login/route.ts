import { NextRequest, NextResponse } from "next/server";
import { turso, generateId } from "@/lib/turso";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    // Find customer by email
    const result = await turso.execute({
      sql: "SELECT id, email, first_name, last_name, password_hash FROM customers WHERE email = ?",
      args: [email],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const customer = result.rows[0];

    // Verify password using bcrypt (consistent with register and next-auth)
    const isValid = await compare(password, customer.password_hash as string);
    if (!isValid) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await turso.execute({
      sql: `INSERT INTO sessions (id, customer_id, token, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [generateId(), customer.id, sessionToken, expiresAt, new Date().toISOString()],
    });

    // Create response with session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: "تم تسجيل الدخول بنجاح",
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
      }
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return response;

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
