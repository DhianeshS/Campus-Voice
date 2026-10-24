import { Response, NextFunction } from 'express';
import { complaintRepository } from '../repositories/complaint.repository';
import { categoryRepository } from '../repositories/category.repository';
import { feedbackService } from '../services/feedback.service';
import {
  queryComplaintSchema,
  createComplaintSchema,
  updateComplaintStatusSchema,
  manageCategorySchema,
} from '../validators/complaint.validator';
import { createFeedbackSchema } from '../validators/feedback.validator';
import type { ApiResponse, Complaint, CategoryInfo, TimelineEvent, Feedback } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const listComplaints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required to access complaints.', 401, 'UNAUTHORIZED');
    }

    const validatedQuery = queryComplaintSchema.parse(req.query);
    const result = await complaintRepository.listComplaints(
      {
        ...validatedQuery,
        department: req.query.department as string,
        assignedTo: req.query.assignedTo as string,
        dateRange: req.query.dateRange as string,
        sortBy: req.query.sortBy as any,
      },
      req.user
    );

    const response: ApiResponse<Complaint[]> = {
      success: true,
      data: result.complaints,
      meta: {
        page: result.page,
        limit: validatedQuery.limit,
        total: result.total,
        totalPages: result.totalPages,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required to submit a complaint.', 401, 'UNAUTHORIZED');
    }

    const validatedInput = createComplaintSchema.parse(req.body);
    const complaint = await complaintRepository.createComplaint(
      {
        title: validatedInput.title,
        description: validatedInput.description,
        category: validatedInput.category,
        priority: validatedInput.priority || 'medium',
        status: 'submitted',
        userId: req.user.id,
        department: validatedInput.department,
        location: validatedInput.location,
        followUpPreferences: validatedInput.followUpPreferences,
        isConfidential: validatedInput.followUpPreferences?.isConfidential || validatedInput.category === 'harassment_misconduct',
      },
      validatedInput.attachments || [],
      req.user
    );

    const response: ApiResponse<Complaint> = {
      success: true,
      message: 'Grievance submitted successfully. Tracking reference generated.',
      data: complaint,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getComplaintDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Complaint ID parameter is required.', 400, 'BAD_REQUEST');
    }

    const complaint = await complaintRepository.getComplaintById(id, req.user);
    if (!complaint) {
      throw new AppError(`Complaint with reference ${id} not found.`, 404, 'NOT_FOUND');
    }

    const response: ApiResponse<Complaint> = {
      success: true,
      data: complaint,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getComplaintHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Complaint ID parameter is required.', 400, 'BAD_REQUEST');
    }

    const complaint = await complaintRepository.getComplaintById(id, req.user);
    if (!complaint) {
      throw new AppError(`Complaint with reference ${id} not found.`, 404, 'NOT_FOUND');
    }

    const response: ApiResponse<TimelineEvent[]> = {
      success: true,
      data: complaint.timeline || [],
      meta: {
        total: complaint.timeline?.length || 0,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Complaint ID parameter is required.', 400, 'BAD_REQUEST');
    }

    const validatedInput = createFeedbackSchema.parse(req.body);
    const feedback = await feedbackService.submitFeedback(
      {
        ...validatedInput,
        complaintId: id,
      },
      req.user
    );

    const response: ApiResponse<Feedback> = {
      success: true,
      message: 'Thank you for your feedback! Your response has been recorded.',
      data: feedback,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categoryRepository.listCategories();
    const response: ApiResponse<CategoryInfo[]> = {
      success: true,
      data: categories,
      meta: {
        total: categories.length,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const manageCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const validatedInput = manageCategorySchema.parse(req.body);
    const updated = await categoryRepository.saveCategory({
      id: validatedInput.id as any,
      name: validatedInput.name,
      description: validatedInput.description,
      department: validatedInput.department,
      isActive: validatedInput.isActive,
    });

    const response: ApiResponse<CategoryInfo> = {
      success: true,
      message: 'Category configuration saved successfully.',
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Complaint ID parameter is required.', 400, 'BAD_REQUEST');
    }

    const validatedInput = updateComplaintStatusSchema.parse(req.body);
    const updated = await complaintRepository.updateStatusTransaction(id, validatedInput.status, {
      publicNote: validatedInput.publicNote,
      internalNote: validatedInput.internalNote,
      assignedTo: validatedInput.assignedTo,
      assignedToName: validatedInput.assignedToName,
      resolutionSummary: validatedInput.resolutionSummary,
      actor: req.user,
    });

    const response: ApiResponse<Complaint> = {
      success: true,
      message: 'Complaint status milestone recorded successfully.',
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
