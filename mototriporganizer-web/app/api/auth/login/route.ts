import { NextResponse } from 'next/server';

export async function GET() {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
  
  const loginUrl = `${auth0Domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&audience=https%3A%2F%2Fapi.mototriporganizer.com`;
  
  return NextResponse.redirect(loginUrl);
}
