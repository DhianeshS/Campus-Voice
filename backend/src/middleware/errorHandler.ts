import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env';
import type { ApiErrorResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        message: 'Input validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      },
      timestamp,
    };
    res.status(400).json(response);
    return;
  }

  // Handle Operational App Errors
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code || 'APP_ERROR',
        details: err.details,
      },
      timestamp,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Unhandled internal server errors
  console.error('Unhandled Server Error:', err);
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      details: config.NODE_ENV === 'production' ? undefined : err.stack,
    },
    timestamp,
  };

  res.status(500).json(response);
};
