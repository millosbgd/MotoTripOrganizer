import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('auth0.user');
  
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie.value);
      return NextResponse.json({ user });
    } catch {
      return NextResponse.json({ user: null });
    }
  }
  
  return NextResponse.json({ user: null });
}
