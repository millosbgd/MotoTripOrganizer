import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  console.log('[MIDDLEWARE] Request:', req.nextUrl.pathname);
  
  // PRIVREMENO: Dozvoli sve reqeste da vidimo da li je ovo problem
  return NextResponse.next();
  
  /* ORIGINALNI KOD - zakomentar isan za testiranje
  // Proveri da li postoji sesija za Auth0
  const { pathname } = req.nextUrl;
  
  // Dozvoli pristup auth endpointima i statičkim resursima
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
    // Redirektuj na login
    const url = req.nextUrl.clone();
    url.pathname = '/api/auth/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
  */
}

export const config = {
  matcher: '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
};
