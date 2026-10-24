import { PoolClient } from 'pg';
import { executeQuery, getDbPool } from '../db/database';
import type { AuditLogEntry } from '../types';

const MEMORY_AUDIT_LOGS: AuditLogEntry[] = [];

export const auditRepository = {
  async recordAuditLog(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp'>,
    client?: PoolClient
  ): Promise<AuditLogEntry> {
    const id = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    if (client) {
      try {
        const res = await client.query(
          `INSERT INTO public.audit_logs (id, complaint_id, actor_id, actor_email, actor_role, action, details, old_value, new_value, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           RETURNING id, complaint_id as "complaintId", actor_id as "actorId", actor_email as "actorEmail", 
                     actor_role as "actorRole", action, details, old_value as "oldValue", new_value as "newValue", created_at as timestamp`,
          [
            id,
            entry.complaintId || null,
            entry.actorId,
            entry.actorEmail,
            entry.actorRole,
            entry.action,
            entry.details,
            entry.oldValue || null,
            entry.newValue || null,
          ]
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
            `INSERT INTO public.audit_logs (id, complaint_id, actor_id, actor_email, actor_role, action, details, old_value, new_value, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
             RETURNING id, complaint_id as "complaintId", actor_id as "actorId", actor_email as "actorEmail", 
                       actor_role as "actorRole", action, details, old_value as "oldValue", new_value as "newValue", created_at as timestamp`,
            [
              id,
              entry.complaintId || null,
              entry.actorId,
              entry.actorEmail,
              entry.actorRole,
              entry.action,
              entry.details,
              entry.oldValue || null,
              entry.newValue || null,
            ]
          );
          if (res.rows.length > 0) return res.rows[0];
        } catch (err) {
          // Fall back to memory
        }
      }
    }

    const logEntry: AuditLogEntry = {
      id,
      timestamp: now,
      ...entry,
    };

    MEMORY_AUDIT_LOGS.unshift(logEntry);
    return logEntry;
  },

  async getAuditLogs(actionFilter?: string): Promise<AuditLogEntry[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        let sql = `SELECT id, complaint_id as "complaintId", actor_id as "actorId", actor_email as "actorEmail", 
                          actor_role as "actorRole", action, details, old_value as "oldValue", new_value as "newValue", 
                          created_at as timestamp
                   FROM public.audit_logs`;
        const params: unknown[] = [];

        if (actionFilter && actionFilter !== 'all') {
          params.push(actionFilter);
          sql += ` WHERE action = $1`;
        }

        sql += ` ORDER BY created_at DESC`;
        const res = await executeQuery<any>(sql, params);
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        // Fall back to memory
      }
    }

    if (actionFilter && actionFilter !== 'all') {
      return MEMORY_AUDIT_LOGS.filter((l) => l.action === actionFilter);
    }
    return [...MEMORY_AUDIT_LOGS];
  },
};
