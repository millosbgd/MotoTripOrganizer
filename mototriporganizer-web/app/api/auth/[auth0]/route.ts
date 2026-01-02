import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const AUTH0_DOMAIN = process.env.AUTH0_ISSUER_BASE_URL;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const BASE_URL = process.env.AUTH0_BASE_URL;
const SECRET = new TextEncoder().encode(process.env.AUTH0_SECRET);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0: action } = await params;
  const searchParams = request.nextUrl.searchParams;

  if (action === 'login') {
    // Redirect to Auth0 login
    const authUrl = new URL(`${AUTH0_DOMAIN}/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', `${BASE_URL}/api/auth/callback`);
    authUrl.searchParams.set('scope', 'openid profile email');
    
    return NextResponse.redirect(authUrl.toString());
  }

  if (action === 'callback') {
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(`${BASE_URL}?error=no_code`);
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(`${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: `${BASE_URL}/api/auth/callback`
        })
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return NextResponse.redirect(`${BASE_URL}?error=token_failed`);
      }

      // Get user info
      const userResponse = await fetch(`${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      
      const user = await userResponse.json();

      // Create session JWT
      const session = await new SignJWT({ user })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(SECRET);

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set('appSession', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return NextResponse.redirect(BASE_URL!);
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${BASE_URL}?error=auth_failed`);
    }
  }

  if (action === 'logout') {
    const cookieStore = await cookies();
    cookieStore.delete('appSession');
    
    // Redirect to Auth0 logout
    const logoutUrl = new URL(`${AUTH0_DOMAIN}/v2/logout`);
    logoutUrl.searchParams.set('client_id', CLIENT_ID!);
    logoutUrl.searchParams.set('returnTo', BASE_URL!);
    
    return NextResponse.redirect(logoutUrl.toString());
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
