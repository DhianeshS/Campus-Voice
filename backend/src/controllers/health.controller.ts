import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';

export const getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await healthService.getHealthStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};
