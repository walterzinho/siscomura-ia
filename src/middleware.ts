import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Public routes that don't require authentication.
 */
const PUBLIC_PATHS = ['/login', '/api/auth'];

/**
 * API routes that require authentication.
 */
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

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname.match(/\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$$/)
  ) {
    return NextResponse.next();
  }

  // Check if authenticated
  const isAuthenticated = !!req.auth;

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
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
