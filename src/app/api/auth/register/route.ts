import { NextRequest, NextResponse } from "next/server";
import { turso, generateId } from "@/lib/turso";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await turso.execute({
      sql: "SELECT id FROM customers WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل مسبقاً" },
        { status: 400 }
      );
    }

    // Hash password with bcrypt (consistent with next-auth)
    const passwordHash = await hash(password, 12);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create customer with unverified status
    const customerId = generateId();
    await turso.execute({
      sql: `INSERT INTO customers (id, email, first_name, last_name, password_hash, email_verified, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [customerId, email, firstName, lastName || "", passwordHash, "0", new Date().toISOString()],
    });

    // Store verification token
    await turso.execute({
      sql: `INSERT INTO email_verifications (id, customer_id, token, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [generateId(), customerId, verificationToken, tokenExpiry, new Date().toISOString()],
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح. يرجى تفعيل حسابك من خلال الرابط المرسل إلى بريدك الإلكتروني.",
    });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}
