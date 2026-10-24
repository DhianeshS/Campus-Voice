import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notificationRepository } from '../repositories/notification.repository';
import type { ApiResponse, StudentNotification } from '../types';

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

    const notifications = await notificationRepository.getNotificationsByUserId(req.user.id);
    const unreadCount = notifications.filter((n) => !n.read).length;

    const response: ApiResponse<StudentNotification[]> = {
      success: true,
      data: notifications,
      meta: {
        total: notifications.length,
        unread: unreadCount,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) throw new AppError('Notification ID is required.', 400, 'BAD_REQUEST');

    await notificationRepository.markAsRead(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

    const count = await notificationRepository.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read.`,
      meta: {
        updatedCount: count,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
