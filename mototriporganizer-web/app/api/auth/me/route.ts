import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth0.token');
    
    if (tokenCookie) {
      return NextResponse.json({ accessToken: tokenCookie.value });
    }
    
    return NextResponse.json({ accessToken: null }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ accessToken: null }, { status: 401 });
  }
}
