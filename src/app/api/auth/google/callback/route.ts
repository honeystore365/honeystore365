import { NextRequest, NextResponse } from "next/server";
import { turso, generateId } from "@/lib/turso";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.nextUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", request.nextUrl.origin)
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userRes.json();

    // Check if user exists, if not create
    let customer = await turso.execute({
      sql: "SELECT id FROM customers WHERE email = ?",
      args: [googleUser.email],
    });

    let customerId: string;

    if (customer.rows.length === 0) {
      // Create new customer
      customerId = generateId();
      const nameParts = (googleUser.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await turso.execute({
        sql: `INSERT INTO customers (id, email, first_name, last_name, created_at) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [customerId, googleUser.email, firstName, lastName, new Date().toISOString()],
      });
    } else {
      customerId = customer.rows[0].id as string;
    }

    // Create session (simple token-based for demo)
    const sessionToken = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await turso.execute({
      sql: `INSERT INTO sessions (id, customer_id, token, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [generateId(), customerId, sessionToken, expiresAt, new Date().toISOString()],
    });

    // Redirect with session cookie
    const response = NextResponse.redirect(
      new URL("/profile", request.nextUrl.origin)
    );

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return response;
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.nextUrl.origin)
    );
  }
}
