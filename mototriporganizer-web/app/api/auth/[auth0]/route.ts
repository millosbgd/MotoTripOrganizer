import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0: action } = await params;
  
  const baseURL = process.env.AUTH0_BASE_URL!;
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL!;
  const clientID = process.env.AUTH0_CLIENT_ID!;
  const audience = process.env.AUTH0_AUDIENCE!;
  const scope = process.env.AUTH0_SCOPE || 'openid profile email';

  switch (action) {
    case 'login':
      const loginURL = new URL(`${issuerBaseURL}/authorize`);
      loginURL.searchParams.set('client_id', clientID);
      loginURL.searchParams.set('response_type', 'code');
      loginURL.searchParams.set('redirect_uri', `${baseURL}/api/auth/callback`);
      loginURL.searchParams.set('scope', scope);
      // Privremeno uklonjen audience za testiranje
      // loginURL.searchParams.set('audience', audience);
      
      console.log('Auth0 Login Request:');
      console.log('  redirect_uri:', `${baseURL}/api/auth/callback`);
      console.log('  client_id:', clientID);
      console.log('  Full URL:', loginURL.toString());
      
      return NextResponse.redirect(loginURL.toString());

    case 'logout':
      const logoutURL = new URL(`${issuerBaseURL}/v2/logout`);
      logoutURL.searchParams.set('client_id', clientID);
      logoutURL.searchParams.set('returnTo', baseURL);
      
      const response = NextResponse.redirect(logoutURL.toString());
      response.cookies.delete('appSession');
      return response;

    case 'callback':
      // Dobavi authorization code iz URL-a
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      
      if (!code) {
        return new Response('Missing authorization code', { status: 400 });
      }

      try {
        // Exchange code za tokens
        const tokenResponse = await fetch(`${issuerBaseURL}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientID,
            client_secret: process.env.AUTH0_CLIENT_SECRET!,
            code: code,
            redirect_uri: `${baseURL}/api/auth/callback`,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error('Token exchange error:', error);
          return new Response('Token exchange failed', { status: 500 });
        }

        const tokens = await tokenResponse.json();
        
        // Kreiraj session cookie
        const session = {
          user: tokens.id_token,
          accessToken: tokens.access_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        };
        
        const response = NextResponse.redirect(baseURL);
        response.cookies.set('appSession', JSON.stringify(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokens.expires_in,
        });
        
        return response;
      } catch (error) {
        console.error('Callback error:', error);
        return new Response('Authentication failed', { status: 500 });
      }

    default:
      return new Response('Not found', { status: 404 });
  }
}
