import { NextResponse } from 'next/server';

export async function GET() {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const returnTo = encodeURIComponent(process.env.AUTH0_BASE_URL || 'https://mototriporganizer-web.vercel.app');
  
  // Redirect to Auth0 logout which will clear Auth0 session and redirect back to our app
  const logoutUrl = `${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${returnTo}`;
  
  const response = NextResponse.redirect(logoutUrl);
  
  // Delete our cookies before redirecting
  response.cookies.set('auth0.user', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('auth0.token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  return response;
}
