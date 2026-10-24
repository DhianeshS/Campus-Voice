import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import type { ApiResponse, AdminDashboardMetrics, Complaint } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getDashboardMetrics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metrics = await adminService.getMetrics();
    const response: ApiResponse<AdminDashboardMetrics> = {
      success: true,
      data: metrics,
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getAdminComplaints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const {
      search,
      status,
      category,
      priority,
      department,
      assignedTo,
      dateRange,
      sortBy,
      page,
      limit,
    } = req.query;

    const result = await adminService.getComplaints(
      {
        search: search as string,
        status: status as string,
        category: category as string,
        priority: priority as string,
        department: department as string,
        assignedTo: assignedTo as string,
        dateRange: dateRange as string,
        sortBy: sortBy as any,
        page: parseSafeInt(page, 1, 1),
        limit: parseSafeInt(limit, 15, 1, 100),
      },
      req.user
    );

    const response: ApiResponse<Complaint[]> = {
      success: true,
      data: result.complaints,
      meta: {
        page: result.page,
        total: result.total,
        limit: parseSafeInt(limit, 15, 1, 100),
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

function parseSafeInt(val: unknown, fallback: number, min = 1, max = 1000): number {
  if (typeof val === 'string') {
    const num = parseInt(val, 10);
    if (Number.isFinite(num)) {
      return Math.min(max, Math.max(min, num));
    }
  }
  return fallback;
}

export const assignComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { officerId, officerName } = req.body;

    if (!officerId || !officerName) {
      throw new AppError('Officer ID and Name are required for assignment.', 400, 'BAD_REQUEST');
    }

    const updated = await adminService.assignComplaint(id, officerId, officerName, req.user);
    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${officerName}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const requestInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { question } = req.body;

    if (!question || !question.trim()) {
      throw new AppError('Clarification question text is required.', 400, 'BAD_REQUEST');
    }

    const updated = await adminService.requestInfo(id, question.trim(), req.user);
    res.status(200).json({
      success: true,
      message: 'Information request sent to student complainant.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { resolutionSummary } = req.body;

    if (!resolutionSummary || !resolutionSummary.trim()) {
      throw new AppError('Resolution summary is required.', 400, 'BAD_REQUEST');
    }

    const updated = await adminService.resolveComplaint(id, resolutionSummary.trim(), req.user);
    res.status(200).json({
      success: true,
      message: 'Grievance resolution verified and recorded.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const closeComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    const updated = await adminService.closeComplaint(id, reason || 'Case concluded', req.user);
    res.status(200).json({
      success: true,
      message: 'Grievance formally closed.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const reopenComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      throw new AppError('Reopen justification reason is required.', 400, 'BAD_REQUEST');
    }

    const updated = await adminService.reopenComplaint(id, reason.trim(), req.user);
    res.status(200).json({
      success: true,
      message: 'Grievance inquiry reopened.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, role } = req.query;
    const users = await adminService.getUsers(search as string, role as string);
    res.status(200).json({
      success: true,
      data: users,
      meta: { total: users.length, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { role } = req.body;

    if (!role || !['student', 'staff', 'admin'].includes(role)) {
      throw new AppError('Valid role (student, staff, admin) is required.', 400, 'BAD_REQUEST');
    }

    const updated = await adminService.updateUserRole(targetUserId, role, req.user);
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { action } = req.query;
    const logs = await adminService.getAuditLogs(action as string);
    res.status(200).json({
      success: true,
      data: logs,
      meta: { total: logs.length, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

export const getOfficers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const officers = adminService.getOfficers();
    res.status(200).json({
      success: true,
      data: officers,
      meta: { total: officers.length, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};
