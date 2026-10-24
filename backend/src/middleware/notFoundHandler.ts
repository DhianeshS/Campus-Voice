import { Request, Response } from 'express';
import type { ApiErrorResponse } from '../types';

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
      code: 'ROUTE_NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};
