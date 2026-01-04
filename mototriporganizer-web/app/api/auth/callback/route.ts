import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
        audience: 'https://api.mototriporganizer.com',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        error: errorText
      });
      
      // Redirect to homepage with error
      return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/?error=auth_failed`);
    }
    
    const tokens = await tokenResponse.json();
    
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      tokenLength: tokens.access_token?.length,
      tokenStart: tokens.access_token?.substring(0, 20)
    });
    
    // Get user info
    const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return NextResponse.json({ 
        error: 'Userinfo failed', 
        details: errorText 
      }, { status: 500 });
    }
    
    const user = await userResponse.json();
    
    // Create redirect response to /trips
    const response = NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/trips`);
    
    // Set cookies
    response.cookies.set('auth0.user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    response.cookies.set('auth0.token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    console.log('Cookies set successfully:', {
      userCookie: response.cookies.get('auth0.user'),
      tokenCookie: response.cookies.get('auth0.token')
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Callback exception', 
      message: error?.message 
    }, { status: 500 });
  }
}
