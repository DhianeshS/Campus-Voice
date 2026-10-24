import { Request, Response, NextFunction } from 'express';
import { feedbackService } from '../services/feedback.service';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { createFeedbackSchema, adminFeedbackQuerySchema } from '../validators/feedback.validator';

export const feedbackController = {
  /**
   * Submits feedback (complaint resolution or general campus feedback).
   */
  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError('Authentication required to submit feedback.', 401, 'UNAUTHORIZED');
      }

      const complaintId = (req.params.id as string) || req.body.complaintId;
      const validatedInput = createFeedbackSchema.parse({
        ...req.body,
        complaintId: complaintId || undefined,
      });

      const feedback = await feedbackService.submitFeedback(validatedInput, authReq.user);

      const response: ApiResponse = {
        success: true,
        message: 'Feedback submitted successfully.',
        data: feedback,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves the student's own submitted feedback.
   */
  async getMyFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError('Authentication required to view submitted feedback.', 401, 'UNAUTHORIZED');
      }

      const feedbackList = await feedbackService.getStudentFeedback(authReq.user);

      const response: ApiResponse = {
        success: true,
        data: feedbackList,
        meta: {
          total: feedbackList.length,
          timestamp: new Date().toISOString(),
        },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lists all feedback for administrators with filters and pagination.
   */
  async listAdminFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const validatedQuery = adminFeedbackQuerySchema.parse(req.query);
      const result = await feedbackService.listAdminFeedback(validatedQuery, authReq.user);

      const response: ApiResponse = {
        success: true,
        data: result.feedback,
        meta: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
          timestamp: new Date().toISOString(),
        },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves live feedback aggregate metrics and recurring concern trends.
   */
  async getFeedbackMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const metrics = await feedbackService.getFeedbackMetrics(
        {
          category: req.query.category as string,
          dateFrom: req.query.dateFrom as string,
          dateTo: req.query.dateTo as string,
        },
        authReq.user
      );

      const response: ApiResponse = {
        success: true,
        data: metrics,
        meta: { timestamp: new Date().toISOString() },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
};
