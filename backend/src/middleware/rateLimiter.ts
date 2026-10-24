import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/env';

/**
 * Standardized 429 Too Many Requests response handler.
 */
const rateLimitHandler = (_req: Request, res: Response, _next: unknown, options: { message: any; statusCode: number }) => {
  res.status(options.statusCode).json({
    success: false,
    error: {
      message: typeof options.message === 'string' ? options.message : 'Too many requests. Please slow down and try again later.',
      code: 'TOO_MANY_REQUESTS',
      retryAfterSeconds: Math.ceil((res.getHeader('Retry-After') as number) || 60),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Global rate limiter: Applies to all API routes.
 * 300 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'API rate limit exceeded. Please try again after 15 minutes.',
});

/**
 * Auth & Sensitive Operations rate limiter:
 * 15 requests per 15 minutes per IP to prevent credential brute-forcing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

/**
 * Submissions rate limiter:
 * Limits grievance creation and feedback submissions to 25 per 15 minutes per IP to prevent spamming and DoS.
 */
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'test' ? 10000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Submission rate limit reached. Please wait before submitting additional records.',
});
