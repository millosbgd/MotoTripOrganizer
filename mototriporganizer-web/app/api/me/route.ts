import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  
  if (!session || !session.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ 
    user: {
      name: session.user.name,
      email: session.user.email,
      picture: session.user.picture,
      sub: session.user.sub
    }
  });
}
