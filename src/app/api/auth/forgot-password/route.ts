import { NextRequest, NextResponse } from "next/server";
import { turso, generateId } from "@/lib/turso";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    // Find customer by email
    const result = await turso.execute({
      sql: `SELECT id FROM customers WHERE email = ?`,
      args: [email],
    });

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لاستعادة كلمة المرور.",
      });
    }

    const customerId = result.rows[0].id as string;

    // Delete any existing reset tokens
    await turso.execute({
      sql: `DELETE FROM password_resets WHERE customer_id = ?`,
      args: [customerId],
    });

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store reset token
    await turso.execute({
      sql: `INSERT INTO password_resets (id, customer_id, token, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [generateId(), customerId, resetToken, tokenExpiry, new Date().toISOString()],
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      success: true,
      message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لاستعادة كلمة المرور.",
    });

  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء استعادة كلمة المرور" },
      { status: 500 }
    );
  }
}
