import { NextResponse } from "next/server";

// Google OAuth Configuration
// To enable Google Login:
// 1. Create OAuth credentials at https://console.cloud.google.com/
// 2. Set authorized redirect URIs to: https://yourdomain.com/api/auth/google/callback
// 3. Add to .env.local:
//    GOOGLE_CLIENT_ID=your_client_id
//    GOOGLE_CLIENT_SECRET=your_client_secret

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "https://honeystore-seven.vercel.app"}/api/auth/google/callback`;

export async function GET() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", process.env.NEXT_PUBLIC_BASE_URL || "https://honeystore-seven.vercel.app")
    );
  }

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "email profile");
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
