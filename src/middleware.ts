import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight auth middleware.
 * Instead of importing auth() (which pulls in Node.js-only deps),
 * we check for the Auth.js session cookie directly.
 * Actual session validation happens server-side in API routes and pages.
 */

const PUBLIC_PATHS = ['/login', '/api/auth'];

const PROTECTED_API_PREFIXES = [
  '/api/generate',
  '/api/generate-phrases',
  '/api/generate-campaign',
  '/api/generate-profile',
  '/api/keys',
  '/api/prompts',
  '/api/station',
  '/api/generations',
  '/api/fetch-url',
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths (login page + auth API routes)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname.match(/\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  // Check for Auth.js session cookie
  const sessionCookie =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  const isAuthenticated = !!sessionCookie?.value;

  // Protect API routes
  if (pathname.startsWith('/api')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Autenticacion requerida' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protect all pages
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
