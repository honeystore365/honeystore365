import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "الرمز مطلوب" },
        { status: 400 }
      );
    }

    // Find verification token
    const result = await turso.execute({
      sql: `SELECT id, customer_id, expires_at FROM email_verifications WHERE token = ?`,
      args: [token],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "الرمز غير صالح" },
        { status: 400 }
      );
    }

    const verification = result.rows[0];

    // Check if expired
    if (new Date(verification.expires_at as string) < new Date()) {
      return NextResponse.json(
        { error: "الرمز منتهي الصلاحية" },
        { status: 400 }
      );
    }

    // Update customer email_verified
    await turso.execute({
      sql: `UPDATE customers SET email_verified = '1' WHERE id = ?`,
      args: [verification.customer_id as string],
    });

    // Delete verification token
    await turso.execute({
      sql: `DELETE FROM email_verifications WHERE id = ?`,
      args: [verification.id as string],
    });

    return NextResponse.json({
      success: true,
      message: "تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.",
    });

  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء تفعيل الحساب" },
      { status: 500 }
    );
  }
}
