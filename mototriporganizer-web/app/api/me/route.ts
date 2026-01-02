import { initAuth0 } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

const auth0 = initAuth0();

export async function GET() {
  const session = await auth0.getSession();
  
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
