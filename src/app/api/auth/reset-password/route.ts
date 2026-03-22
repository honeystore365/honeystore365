import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // Verify the reset code
    const resetCodes = await turso.execute({
      sql: `SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`,
      args: [email, code],
    });

    if (resetCodes.rows.length === 0) {
      return NextResponse.json(
        { error: "الرمز غير صحيح أو منتهي الصلاحية" },
        { status: 400 }
      );
    }

    const resetRecord = resetCodes.rows[0] as any;
    const expiresAt = new Date(resetRecord.expires_at).getTime();
    const now = Date.now();

    if (expiresAt < now) {
      return NextResponse.json(
        { error: "الرمز منتهي الصلاحية" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update the customer's password
    await turso.execute({
      sql: `UPDATE customers SET password_hash = ? WHERE email = ?`,
      args: [hashedPassword, email],
    });

    // Mark the code as used
    await turso.execute({
      sql: `UPDATE password_reset_codes SET used = 1 WHERE email = ? AND code = ?`,
      args: [email, code],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
