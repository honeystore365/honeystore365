import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { signIn } from '@/actions/authActions';

export async function GET() {
  const callbackUrl = new URL('http://localhost:3000/auth/google/callback', typeof window !== 'undefined' ? window.location.href : '');
  
  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: callbackUrl.href,
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'email profile'
  });
  
  return NextResponse.redirect(url);
}
