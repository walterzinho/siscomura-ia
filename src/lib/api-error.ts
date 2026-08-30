/**
 * Shared error handler for API routes.
 * Centralizes the repetitive try/catch + error typing pattern.
 * Usage: wrapApiHandler(routeName, handler)
 */
import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError } from '@/lib/rate-limit';
import { ValidationError } from '@/lib/validations';
import { logError } from '@/lib/logger';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

type HandlerResult = Promise<NextResponse>;

/**
 * Wraps an API route handler with standardized error handling.
 * Catches RateLimitError (429), ValidationError (400), and generic errors (500).
 * Logs all unexpected errors.
 */
export function apiHandler(route: string, handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message },
          {
            status: 429,
            headers: { 'Retry-After': String(error.retryAfter) },
          }
        );
      }
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Error desconocido';
      logError(route, message, { error: message });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Returns a standardized error response (for use outside apiHandler).
 */
export function errorResponse(
  error: unknown,
  route: string
): NextResponse {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) },
      }
    );
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Error desconocido';
  logError(route, message, { error: message });
  return NextResponse.json({ error: message }, { status: 500 });
}
