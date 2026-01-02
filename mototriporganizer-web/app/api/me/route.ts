import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('appSession');
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Decode JWT without verification (already verified by Auth0)
    const tokenParts = session.user.split('.');
    if (tokenParts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }
    
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    return NextResponse.json({
      name: payload.name || payload.email,
      email: payload.email,
      picture: payload.picture,
      sub: payload.sub,
    });
  } catch (error) {
    console.error('Error parsing session:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
