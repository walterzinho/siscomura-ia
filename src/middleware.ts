import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Route matcher: API routes that require authentication.
 * Public routes (health, test-db) are excluded.
 */
const isProtectedApi = createRouteMatcher([
  '/api/generate(.*)',
  '/api/generate-phrases(.*)',
  '/api/generate-campaign(.*)',
  '/api/generate-profile(.*)',
  '/api/keys(.*)',
  '/api/prompts(.*)',
  '/api/station(.*)',
  '/api/generations(.*)',
  '/api/fetch-url(.*)',
]);

/**
 * Public routes that anyone can access (even without auth).
 */
const isPublicRoute = createRouteMatcher([
  '/api/health',
  '/api/test-db',
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // Allow public API routes
  if (isPublicRoute(req)) {
    return;
  }

  // Protect API routes
  if (isProtectedApi(req)) {
    const { userId } = await auth();
    if (!userId) {
      const apiRes = new Response(
        JSON.stringify({ error: 'Autenticacion requerida' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
      return apiRes;
    }
    return;
  }

  // Protect all pages (non-API routes)
  if (!url.pathname.startsWith('/api')) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', url.origin);
      signInUrl.searchParams.set('redirect_url', url.href);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
