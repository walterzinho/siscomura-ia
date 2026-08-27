/**
 * Rate limiting using an in-memory store with rate-limiter-flexible.
 * On Vercel serverless, each instance has its own memory,
 * so this provides per-instance rate limiting. For global rate limiting
 * across instances, a Redis-backed store would be needed.
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

export type RateLimitConfig = 'generate' | 'write' | 'admin';

const limiters: Record<RateLimitConfig, RateLimiterMemory> = {
  generate: new RateLimiterMemory({
    points: 20,
    duration: 60, // 20 requests per minute
  }),
  write: new RateLimiterMemory({
    points: 10,
    duration: 60, // 10 requests per minute
  }),
  admin: new RateLimiterMemory({
    points: 5,
    duration: 60, // 5 requests per minute
  }),
};

export async function rateLimit(
  config: RateLimitConfig,
  keyPrefix: string = 'global',
): Promise<{ success: boolean; remaining: number; retryMs?: number }> {
  const limiter = limiters[config];
  const key = `${config}:${keyPrefix}`;

  try {
    const result = await limiter.consume(key);
    return {
      success: true,
      remaining: result.remainingPoints,
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'msBeforeNext' in error
    ) {
      const rlError = error as { msBeforeNext: number };
      return {
        success: false,
        remaining: 0,
        retryMs: rlError.msBeforeNext,
      };
    }
    return {
      success: false,
      remaining: 0,
    };
  }
}

/**
 * Express/Next.js compatible rate limit middleware helper.
 * Throws an error with status 429 if rate limited.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  keyPrefix: string = 'global',
): Promise<void> {
  const result = await rateLimit(config, keyPrefix);
  if (!result.success) {
    const retryAfterSec = Math.ceil((result.retryMs || 60000) / 1000);
    throw new RateLimitError(
      `Demasiadas solicitudes. Intenta de nuevo en ${retryAfterSec} segundos.`,
      retryAfterSec,
    );
  }
}

export class RateLimitError extends Error {
  public retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
