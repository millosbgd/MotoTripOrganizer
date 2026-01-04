import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Extract action from path: /api/auth/login -> 'login', /api/auth/callback -> 'callback'
  const pathParts = pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1];
  
  console.log('Auth route - pathname:', pathname, 'action:', action);
  
  if (action === 'login') {
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
    
    const loginUrl = `${auth0Domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&audience=https%3A%2F%2Fapi.mototriporganizer.com`;
    
    return NextResponse.redirect(loginUrl);
  }
  
  if (action === 'logout') {
    const response = NextResponse.json({ success: true });
    
    // Delete cookies
    response.cookies.delete('auth0.user');
    response.cookies.delete('auth0.token');
    
    return response;
  }
  
  if (action === 'callback') {
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'No code in URL' }, { status: 400 });
    }
    
    try {
      const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          code,
          redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return NextResponse.json({ 
          error: 'Token exchange failed', 
          details: errorText,
          status: tokenResponse.status 
        }, { status: 500 });
      }
      
      const tokens = await tokenResponse.json();
      
      const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        return NextResponse.json({ 
          error: 'Userinfo failed', 
          details: errorText,
          status: userResponse.status 
        }, { status: 500 });
      }
      
      const user = await userResponse.json();
      
      const response = NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/trips`);
      
      response.cookies.set('auth0.user', JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      
      response.cookies.set('auth0.token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      
      return response;
    } catch (error: any) {
      return NextResponse.json({ 
        error: 'Callback exception', 
        message: error?.message,
        stack: error?.stack 
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
