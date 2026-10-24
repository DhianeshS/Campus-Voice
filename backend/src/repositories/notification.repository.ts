import { PoolClient } from 'pg';
import { executeQuery, getDbPool } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import type { StudentNotification } from '../types';

const MEMORY_NOTIFICATIONS = new Map<string, StudentNotification>();

export const notificationRepository = {
  async createNotification(
    userId: string,
    title: string,
    message: string,
    complaintId?: string,
    type: StudentNotification['type'] = 'status_update',
    client?: PoolClient
  ): Promise<StudentNotification> {
    const id = `NTF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    if (client) {
      try {
        const res = await client.query(
          `INSERT INTO public.notifications (id, user_id, complaint_id, title, message, type, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
           RETURNING id, user_id as "userId", complaint_id as "complaintId", title, message, type, is_read as read, created_at as "createdAt"`,
          [id, userId, complaintId || null, title, message, type]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        // Fall back to memory
      }
    } else {
      const pool = getDbPool();
      if (pool) {
        try {
          const res = await executeQuery<any>(
            `INSERT INTO public.notifications (id, user_id, complaint_id, title, message, type, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
             RETURNING id, user_id as "userId", complaint_id as "complaintId", title, message, type, is_read as read, created_at as "createdAt"`,
            [id, userId, complaintId || null, title, message, type]
          );
          if (res.rows.length > 0) return res.rows[0];
        } catch (err) {
          // Fall back to memory
        }
      }
    }

    const newNotif: StudentNotification = {
      id,
      userId,
      title,
      message,
      complaintId,
      read: false,
      createdAt: now,
      type,
    };

    MEMORY_NOTIFICATIONS.set(id, newNotif);
    return newNotif;
  },

  async getNotificationsByUserId(userId: string): Promise<StudentNotification[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT id, user_id as "userId", complaint_id as "complaintId", title, message, type, is_read as read, created_at as "createdAt"
           FROM public.notifications
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId]
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        // Fall back to memory
      }
    }

    const notifs = Array.from(MEMORY_NOTIFICATIONS.values()).filter((n) => (n as any).userId === userId);
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `UPDATE public.notifications
           SET is_read = true
           WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );
        return (res.rowCount || 0) > 0;
      } catch (err) {
        // Fall back to memory
      }
    }

    const notif = MEMORY_NOTIFICATIONS.get(id);
    if (notif) {
      if ((notif as any).userId && (notif as any).userId !== userId) {
        throw new AppError("Access forbidden: You do not have permission to modify another user's notification.", 403, 'FORBIDDEN');
      }
      notif.read = true;
      return true;
    }
    return false;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `UPDATE public.notifications
           SET is_read = true
           WHERE user_id = $1 AND is_read = false`,
          [userId]
        );
        return res.rowCount || 0;
      } catch (err) {
        // Fall back to memory
      }
    }

    let count = 0;
    for (const notif of MEMORY_NOTIFICATIONS.values()) {
      if ((notif as any).userId === userId && !notif.read) {
        notif.read = true;
        count++;
      }
    }
    return count;
  },
};
