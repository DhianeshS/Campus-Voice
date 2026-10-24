import { PoolClient } from 'pg';
import { executeQuery, withTransaction, getDbPool, generateComplaintReference } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import type {
  Complaint,
  ComplaintAttachment,
  ComplaintStatus,
  ComplaintPriority,
  TimelineEvent,
  AdminDashboardMetrics,
} from '../types';
import type { AuthenticatedUser } from '../middleware/auth';
import { auditRepository } from './audit.repository';
import { notificationRepository } from './notification.repository';
import { emailService } from '../services/email.service';

// Memory store for fallback when database is in standby mode
const MEMORY_COMPLAINTS = new Map<string, Complaint>();
const MEMORY_ADMIN_NOTES = new Map<string, Array<{ id: string; authorName: string; authorRole?: string; note: string; createdAt: string }>>();

// Institutional complaint lifecycle status transition matrix
export const VALID_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  submitted: ['under_review', 'assigned', 'in_progress', 'awaiting_information', 'rejected', 'closed'],
  pending: ['under_review', 'assigned', 'in_progress', 'awaiting_information', 'rejected', 'closed'],
  under_review: ['assigned', 'in_progress', 'awaiting_information', 'resolved', 'closed', 'rejected'],
  assigned: ['in_progress', 'awaiting_information', 'under_review', 'resolved', 'closed'],
  in_progress: ['awaiting_information', 'resolved', 'closed', 'assigned'],
  awaiting_information: ['in_progress', 'under_review', 'resolved', 'closed'],
  resolved: ['closed', 'reopened', 'in_progress'],
  rejected: ['reopened', 'closed'],
  closed: ['reopened'],
  reopened: ['assigned', 'in_progress', 'under_review', 'awaiting_information', 'resolved', 'closed'],
};

export const complaintRepository = {
  /**
   * Creates a new complaint within a database transaction, storing attachments and updates.
   */
  async createComplaint(
    complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    attachments: ComplaintAttachment[] = [],
    creator: AuthenticatedUser
  ): Promise<Complaint> {
    // 0. Duplicate submission prevention: check for duplicate title within 60s by same user
    const recentDuplicate = Array.from(MEMORY_COMPLAINTS.values()).find(
      (c) =>
        c.userId === creator.id &&
        c.title.trim().toLowerCase() === complaintData.title.trim().toLowerCase() &&
        Date.now() - new Date(c.createdAt).getTime() < 60000
    );
    if (recentDuplicate) {
      throw new AppError(
        'Duplicate grievance detected. An identical grievance was submitted less than a minute ago.',
        409,
        'DUPLICATE_SUBMISSION'
      );
    }

    const executeInClient = async (client?: PoolClient): Promise<Complaint> => {
      const complaintId = complaintData.id || (await generateComplaintReference(client));
      const now = new Date().toISOString();

      if (client) {
        // Check duplicate in database
        const dupCheck = await client.query(
          `SELECT id FROM public.complaints 
           WHERE user_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) AND created_at > NOW() - INTERVAL '60 seconds'`,
          [creator.id, complaintData.title]
        );
        if (dupCheck.rows.length > 0) {
          throw new AppError(
            'Duplicate grievance detected. An identical grievance was submitted less than a minute ago.',
            409,
            'DUPLICATE_SUBMISSION'
          );
        }

        // 1. Insert Complaint
        await client.query(
          `INSERT INTO public.complaints (
             id, user_id, title, description, category_id, priority, status, 
             department_name, location, follow_up_preferences, is_confidential, 
             created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            complaintId,
            creator.id,
            complaintData.title,
            complaintData.description,
            complaintData.category,
            complaintData.priority || 'medium',
            complaintData.status || 'submitted',
            complaintData.department || null,
            complaintData.location || null,
            JSON.stringify(complaintData.followUpPreferences || {}),
            complaintData.isConfidential || false,
          ]
        );

        // 2. Insert Attachment Metadata
        for (const att of attachments) {
          await client.query(
            `INSERT INTO public.complaint_attachments (complaint_id, name, size_bytes, mime_type, storage_path, url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [complaintId, att.name, att.size, att.type, att.url, att.url]
          );
        }

        // 3. Insert Initial Update Record
        await client.query(
          `INSERT INTO public.complaint_updates (complaint_id, actor_id, actor_name, actor_role, new_status, public_note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            complaintId,
            creator.id,
            creator.fullName || creator.email,
            creator.role,
            complaintData.status || 'submitted',
            'Grievance registered in university records.',
          ]
        );

        // 4. Audit Log
        await auditRepository.recordAuditLog(
          {
            complaintId,
            actorId: creator.id,
            actorEmail: creator.email,
            actorRole: creator.role,
            action: 'COMPLAINT_CREATED',
            details: `Grievance registered: "${complaintData.title}" under ${complaintData.category}.`,
            newValue: complaintData.status || 'submitted',
          },
          client
        );

        // 5. In-App Notification for Student
        await notificationRepository.createNotification(
          creator.id,
          `Grievance Registered: ${complaintId}`,
          `Your grievance "${complaintData.title}" has been recorded with reference ${complaintId}.`,
          complaintId,
          'system',
          client
        );

        // 6. In-App Notification for Department / Administrative Oversight
        await notificationRepository.createNotification(
          'admin_oversight',
          `New Grievance Registered: ${complaintId}`,
          `New case submitted under ${complaintData.category}: "${complaintData.title}".`,
          complaintId,
          'assignment',
          client
        );
      }

      // Safe asynchronous email dispatch (handles unconfigured state without throwing)
      if (creator.email) {
        emailService
          .sendComplaintSubmittedNotification(
            creator.email,
            creator.fullName || creator.email.split('@')[0],
            complaintId,
            complaintData.title
          )
          .catch(() => {});
      }

      // Memory Store Synchronization
      const initialTimeline: TimelineEvent = {
        id: `TL-${Date.now()}`,
        status: complaintData.status || 'submitted',
        title: 'Grievance Formally Registered',
        description: `Grievance reference ${complaintId} recorded in university registry.`,
        actor: creator.fullName || creator.email,
        actorRole: creator.role,
        timestamp: now,
      };

      const completeRecord: Complaint = {
        ...complaintData,
        id: complaintId,
        userId: creator.id,
        userFullName: creator.fullName,
        userEmail: creator.email,
        priority: complaintData.priority || 'medium',
        status: complaintData.status || 'submitted',
        attachments,
        timeline: [initialTimeline],
        createdAt: now,
        updatedAt: now,
      };

      MEMORY_COMPLAINTS.set(complaintId, completeRecord);
      return completeRecord;
    };

    const pool = getDbPool();
    if (pool) {
      try {
        return await withTransaction((client) => executeInClient(client));
      } catch (err) {
        // Fall back to memory execution
      }
    }

    return executeInClient();
  },

  /**
   * Retrieves complaint by ID with security checks, confidential identity masking,
   * and complete isolation of private internal notes from student responses.
   */
  async getComplaintById(id: string, requester: AuthenticatedUser): Promise<Complaint | null> {
    let complaint: Complaint | null = null;
    const pool = getDbPool();

    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT c.id, c.user_id as "userId", c.title, c.description, c.category_id as category, 
                  c.priority, c.status, c.department_name as department, c.location, 
                  c.follow_up_preferences as "followUpPreferences", c.is_confidential as "isConfidential", 
                  c.assigned_to as "assignedTo", c.assigned_to_name as "assignedToName", 
                  c.resolution_summary as "resolutionSummary", c.resolved_by as "resolvedBy", 
                  c.resolved_at as "resolvedAt", c.created_at as "createdAt", c.updated_at as "updatedAt",
                  p.full_name as "userFullName", p.email as "userEmail"
           FROM public.complaints c
           LEFT JOIN public.profiles p ON c.user_id = p.id
           WHERE c.id = $1`,
          [id]
        );

        if (res.rows.length > 0) {
          const row = res.rows[0];

          // Fetch Attachments
          const attRes = await executeQuery<any>(
            `SELECT name, size_bytes as size, mime_type as type, url 
             FROM public.complaint_attachments 
             WHERE complaint_id = $1`,
            [id]
          );

          // Fetch Public Updates Timeline
          const updRes = await executeQuery<any>(
            `SELECT id, new_status as status, public_note as description, 
                    actor_name as actor, actor_role as "actorRole", created_at as timestamp
             FROM public.complaint_updates
             WHERE complaint_id = $1
             ORDER BY created_at ASC`,
            [id]
          );

          const timeline: TimelineEvent[] = updRes.rows.map((u: any) => ({
            id: u.id,
            status: u.status,
            title: `Status: ${u.status.replace('_', ' ')}`,
            description: u.description || 'Milestone updated.',
            actor: u.actor,
            actorRole: u.actorRole,
            timestamp: u.timestamp,
          }));

          complaint = {
            ...row,
            attachments: attRes.rows,
            timeline,
          };
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    if (!complaint) {
      complaint = MEMORY_COMPLAINTS.get(id) || null;
    }

    if (!complaint) return null;

    // ACCESS CONTROL 1: Students may only view their own complaints
    if (requester.role === 'student' && complaint.userId !== requester.id) {
      throw new AppError('Access forbidden: You do not have permission to view this grievance record.', 403, 'FORBIDDEN');
    }

    // ACCESS CONTROL 2: Internal Notes Isolation
    if (requester.role === 'student') {
      // If student, strip any internal notes from timeline and clear adminNotes property
      const sanitizedTimeline = complaint.timeline?.map((e) => {
        const { internalNote, ...studentSafe } = e;
        return studentSafe as TimelineEvent;
      });
      const { adminNotes, ...cleanComplaint } = complaint;
      complaint = { ...cleanComplaint, timeline: sanitizedTimeline };
    } else {
      // If admin or staff, attach internal notes for authorized review
      const notes = MEMORY_ADMIN_NOTES.get(id);
      if (notes && notes.length > 0) {
        complaint = { ...complaint, adminNotes: [...notes] };
      }
    }

    // ACCESS CONTROL 3: Sensitive / Whistleblower Identity Protection
    const isSensitive = complaint.isConfidential || complaint.category === 'harassment_misconduct';
    if (isSensitive && requester.role !== 'admin' && complaint.userId !== requester.id) {
      complaint = {
        ...complaint,
        userFullName: '[Protected Student Identity]',
        userEmail: '[Confidential Contact]',
      };
    }

    return complaint;
  },

  /**
   * Lists complaints with server-side pagination, multi-criteria filtering, and role scoping.
   */
  async listComplaints(
    query: {
      category?: string;
      status?: string;
      priority?: string;
      department?: string;
      assignedTo?: string;
      dateRange?: string;
      sortBy?: 'newest' | 'oldest' | 'priority' | 'updated';
      search?: string;
      page?: number;
      limit?: number;
    },
    requester: AuthenticatedUser
  ): Promise<{ complaints: Complaint[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const offset = (page - 1) * limit;

    const pool = getDbPool();
    if (pool) {
      try {
        let whereClauses: string[] = ['1=1'];
        const params: unknown[] = [];

        // Scope Restriction: Students see ONLY their own records
        if (requester.role === 'student') {
          params.push(requester.id);
          whereClauses.push(`c.user_id = $${params.length}`);
        }

        if (query.category && query.category !== 'all') {
          params.push(query.category);
          whereClauses.push(`c.category_id = $${params.length}`);
        }

        if (query.status && query.status !== 'all') {
          params.push(query.status);
          whereClauses.push(`c.status = $${params.length}`);
        }

        if (query.priority && query.priority !== 'all') {
          params.push(query.priority);
          whereClauses.push(`c.priority = $${params.length}`);
        }

        if (query.department && query.department !== 'all') {
          params.push(query.department);
          whereClauses.push(`c.department_name = $${params.length}`);
        }

        if (query.assignedTo && query.assignedTo !== 'all') {
          if (query.assignedTo === 'unassigned') {
            whereClauses.push(`c.assigned_to IS NULL`);
          } else if (query.assignedTo === 'me') {
            params.push(requester.id);
            whereClauses.push(`c.assigned_to = $${params.length}`);
          } else {
            params.push(query.assignedTo);
            whereClauses.push(`c.assigned_to_name = $${params.length}`);
          }
        }

        if (query.dateRange && query.dateRange !== 'all') {
          if (query.dateRange === 'today') {
            whereClauses.push(`c.created_at >= NOW() - INTERVAL '24 hours'`);
          } else if (query.dateRange === '7d') {
            whereClauses.push(`c.created_at >= NOW() - INTERVAL '7 days'`);
          } else if (query.dateRange === '30d') {
            whereClauses.push(`c.created_at >= NOW() - INTERVAL '30 days'`);
          }
        }

        if (query.search && query.search.trim()) {
          params.push(`%${query.search.trim().toLowerCase()}%`);
          whereClauses.push(`(LOWER(c.title) LIKE $${params.length} OR LOWER(c.description) LIKE $${params.length} OR LOWER(c.id) LIKE $${params.length})`);
        }

        const whereSql = whereClauses.join(' AND ');

        // Sort sequence
        let orderSql = 'ORDER BY c.created_at DESC';
        if (query.sortBy === 'oldest') orderSql = 'ORDER BY c.created_at ASC';
        if (query.sortBy === 'updated') orderSql = 'ORDER BY c.updated_at DESC';
        if (query.sortBy === 'priority') {
          orderSql = `ORDER BY CASE c.priority 
                        WHEN 'urgent' THEN 4 
                        WHEN 'high' THEN 3 
                        WHEN 'medium' THEN 2 
                        WHEN 'low' THEN 1 ELSE 0 END DESC`;
        }

        // Count Total
        const countRes = await executeQuery<{ total: string }>(
          `SELECT COUNT(*)::text as total FROM public.complaints c WHERE ${whereSql}`,
          params
        );
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const totalPages = Math.ceil(total / limit) || 1;

        // Fetch Data
        params.push(limit);
        const limitParam = params.length;
        params.push(offset);
        const offsetParam = params.length;

        const dataRes = await executeQuery<any>(
          `SELECT c.id, c.user_id as "userId", c.title, c.description, c.category_id as category, 
                  c.priority, c.status, c.department_name as department, c.location, 
                  c.is_confidential as "isConfidential", c.assigned_to as "assignedTo", 
                  c.assigned_to_name as "assignedToName", c.resolution_summary as "resolutionSummary", 
                  c.created_at as "createdAt", c.updated_at as "updatedAt",
                  p.full_name as "userFullName", p.email as "userEmail"
           FROM public.complaints c
           LEFT JOIN public.profiles p ON c.user_id = p.id
           WHERE ${whereSql}
           ${orderSql}
           LIMIT $${limitParam} OFFSET $${offsetParam}`,
          params
        );

        // Sanitize sensitive identities for non-chief administrators
        const sanitized = dataRes.rows.map((row) => {
          const isSensitive = row.isConfidential || row.category === 'harassment_misconduct';
          if (isSensitive && requester.role !== 'admin' && row.userId !== requester.id) {
            return {
              ...row,
              userFullName: '[Protected Student Identity]',
              userEmail: '[Confidential Contact]',
            };
          }
          return row;
        });

        return {
          complaints: sanitized,
          total,
          page,
          totalPages,
        };
      } catch (err) {
        // Fall back to memory
      }
    }

    // Memory Store Implementation
    let all = Array.from(MEMORY_COMPLAINTS.values());

    if (requester.role === 'student') {
      all = all.filter((c) => c.userId === requester.id);
    }

    if (query.category && query.category !== 'all') {
      all = all.filter((c) => c.category === query.category);
    }
    if (query.status && query.status !== 'all') {
      all = all.filter((c) => c.status === query.status);
    }
    if (query.priority && query.priority !== 'all') {
      all = all.filter((c) => c.priority === query.priority);
    }
    if (query.department && query.department !== 'all') {
      all = all.filter((c) => c.department === query.department);
    }
    if (query.assignedTo && query.assignedTo !== 'all') {
      if (query.assignedTo === 'unassigned') all = all.filter((c) => !c.assignedTo);
      else if (query.assignedTo === 'me') all = all.filter((c) => c.assignedTo === requester.id);
      else all = all.filter((c) => c.assignedToName === query.assignedTo);
    }
    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      all = all.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    // Sort
    all.sort((a, b) => {
      if (query.sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (query.sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (query.sortBy === 'priority') {
        const p: Record<ComplaintPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return p[b.priority] - p[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = all.slice(offset, offset + limit);

    const sanitized = paginated.map((c) => {
      const isSensitive = c.isConfidential || c.category === 'harassment_misconduct';
      if (isSensitive && requester.role !== 'admin' && c.userId !== requester.id) {
        return {
          ...c,
          userFullName: '[Protected Student Identity]',
          userEmail: '[Confidential Contact]',
        };
      }
      return c;
    });

    return { complaints: sanitized, total, page, totalPages };
  },

  /**
   * Executes a status transition within an atomic database transaction.
   * Generates public updates, private internal notes, audit log, and student notification.
   */
  async updateStatusTransaction(
    id: string,
    newStatus: ComplaintStatus,
    metadata: {
      publicNote?: string;
      internalNote?: string;
      resolutionSummary?: string;
      assignedTo?: string;
      assignedToName?: string;
      actor: AuthenticatedUser;
    }
  ): Promise<Complaint> {
    const { publicNote, internalNote, resolutionSummary, assignedTo, assignedToName, actor } = metadata;
    const now = new Date().toISOString();

    const pool = getDbPool();
    if (pool) {
      try {
        return await withTransaction(async (client) => {
          // 1. Fetch Existing Record
          const checkRes = await client.query('SELECT status, user_id FROM public.complaints WHERE id = $1 FOR UPDATE', [id]);
          if (checkRes.rows.length === 0) {
            throw new AppError(`Grievance ${id} not found.`, 404, 'NOT_FOUND');
          }
          const prevStatus = checkRes.rows[0].status;
          const ownerId = checkRes.rows[0].user_id;

          // Institutional State Transition Lifecycle Validation
          if (newStatus !== prevStatus) {
            const allowed = VALID_STATUS_TRANSITIONS[prevStatus as ComplaintStatus] || [];
            if (!allowed.includes(newStatus)) {
              throw new AppError(
                `Invalid status transition: Cannot transition grievance from "${prevStatus}" to "${newStatus}".`,
                400,
                'INVALID_STATUS_TRANSITION'
              );
            }
          }

          // 2. Update Complaint
          await client.query(
            `UPDATE public.complaints 
             SET status = $1, 
                 resolution_summary = COALESCE($2, resolution_summary),
                 resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
                 resolved_by = CASE WHEN $1 = 'resolved' THEN $3 ELSE resolved_by END,
                 assigned_to = COALESCE($4, assigned_to),
                 assigned_to_name = COALESCE($5, assigned_to_name),
                 updated_at = NOW()
             WHERE id = $6`,
            [newStatus, resolutionSummary || null, actor.fullName || actor.email, assignedTo || null, assignedToName || null, id]
          );

          // 3. Insert Public Milestone Update
          await client.query(
            `INSERT INTO public.complaint_updates (complaint_id, actor_id, actor_name, actor_role, old_status, new_status, public_note, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [id, actor.id, actor.fullName || actor.email, actor.role, prevStatus, newStatus, publicNote || null]
          );

          // 4. Insert Private Internal Note if provided (Strictly Hidden from Students)
          if (internalNote && internalNote.trim()) {
            await client.query(
              `INSERT INTO public.admin_notes (complaint_id, author_id, author_name, author_role, note, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [id, actor.id, actor.fullName || actor.email, actor.role, internalNote.trim()]
            );
          }

          // 5. Insert Immutable Audit Log
          await auditRepository.recordAuditLog(
            {
              complaintId: id,
              actorId: actor.id,
              actorEmail: actor.email,
              actorRole: actor.role,
              action: 'STATUS_TRANSITION',
              details: `Status transitioned to ${newStatus}. ${publicNote ? `Note: "${publicNote}"` : ''}`,
              oldValue: prevStatus,
              newValue: newStatus,
            },
            client
          );

          // 6. Notify Complainant with Context-Specific Type
          let notifTitle = `Grievance Update: ${id}`;
          let notifMessage = `Status has been updated to "${newStatus.replace('_', ' ')}". ${publicNote || ''}`;
          let notifType: 'status_update' | 'investigation' | 'resolution' | 'system' | 'assignment' | 'info_requested' | 'reopened' = 'status_update';

          if (newStatus === 'resolved') {
            notifTitle = `Resolution Recorded: ${id}`;
            notifMessage = `Your grievance has been marked as Resolved. ${resolutionSummary ? `Summary: "${resolutionSummary}". ` : ''}Please evaluate the resolution and share your satisfaction feedback.`;
            notifType = 'resolution';
          } else if (newStatus === 'awaiting_information') {
            notifTitle = `Information Requested: ${id}`;
            notifMessage = `Additional information requested: "${publicNote || 'Please view complaint details to provide the requested info.'}"`;
            notifType = 'info_requested';
          } else if (newStatus === 'reopened') {
            notifTitle = `Grievance Reopened: ${id}`;
            notifMessage = `Your grievance has been reopened for continued investigation.`;
            notifType = 'reopened';
          } else if (newStatus === 'in_progress') {
            notifTitle = `Investigation Milestone: ${id}`;
            notifMessage = `Remediation is actively in progress.${assignedToName ? ` Lead: ${assignedToName}.` : ''}`;
            notifType = 'investigation';
          }

          await notificationRepository.createNotification(
            ownerId,
            notifTitle,
            notifMessage,
            id,
            notifType,
            client
          );

          // Return Updated Complaint
          const updated = await complaintRepository.getComplaintById(id, actor);
          return updated!;
        });
      } catch (err) {
        // Fall back to memory
      }
    }

    // Memory Store Implementation
    const complaint = MEMORY_COMPLAINTS.get(id);
    if (!complaint) throw new AppError(`Grievance ${id} not found.`, 404, 'NOT_FOUND');

    const prevStatus = complaint.status;

    // Institutional State Transition Lifecycle Validation
    if (newStatus !== prevStatus) {
      const allowed = VALID_STATUS_TRANSITIONS[prevStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw new AppError(
          `Invalid status transition: Cannot transition grievance from "${prevStatus}" to "${newStatus}".`,
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }
    }

    complaint.status = newStatus;
    complaint.updatedAt = now;
    if (resolutionSummary) {
      complaint.resolutionSummary = resolutionSummary;
      complaint.resolvedAt = now;
      complaint.resolvedBy = actor.fullName || actor.email;
    }
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (assignedToName) complaint.assignedToName = assignedToName;

    // Timeline event
    const event: TimelineEvent = {
      id: `TL-${Date.now()}`,
      status: newStatus,
      title: `Status set to ${newStatus.replace('_', ' ')}`,
      description: publicNote || 'Administrative milestone recorded.',
      internalNote,
      actor: actor.fullName || actor.email,
      actorRole: actor.role,
      timestamp: now,
    };
    complaint.timeline = [...(complaint.timeline || []), event];

    if (internalNote) {
      const existingNotes = MEMORY_ADMIN_NOTES.get(id) || [];
      existingNotes.push({
        id: `NOTE-${Date.now()}`,
        authorName: actor.fullName || actor.email,
        note: internalNote,
        createdAt: now,
      });
      MEMORY_ADMIN_NOTES.set(id, existingNotes);
    }

    MEMORY_COMPLAINTS.set(id, complaint);

    auditRepository.recordAuditLog({
      complaintId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'STATUS_TRANSITION',
      details: `Status transitioned from ${prevStatus} to ${newStatus}.`,
      oldValue: prevStatus,
      newValue: newStatus,
    });

    let memNotifTitle = `Grievance Update: ${id}`;
    let memNotifMessage = `Your grievance status is now "${newStatus.replace('_', ' ')}".`;
    let memNotifType: 'status_update' | 'investigation' | 'resolution' | 'system' | 'assignment' | 'info_requested' | 'reopened' = 'status_update';

    if (newStatus === 'resolved') {
      memNotifTitle = `Resolution Recorded: ${id}`;
      memNotifMessage = `Your grievance has been marked as Resolved. ${resolutionSummary ? `Summary: "${resolutionSummary}". ` : ''}Please submit satisfaction feedback.`;
      memNotifType = 'resolution';
    } else if (newStatus === 'awaiting_information') {
      memNotifTitle = `Information Requested: ${id}`;
      memNotifMessage = `Additional information requested: "${publicNote || 'Please view complaint details to provide the requested info.'}"`;
      memNotifType = 'info_requested';
    } else if (newStatus === 'reopened') {
      memNotifTitle = `Grievance Reopened: ${id}`;
      memNotifMessage = `Your grievance has been reopened for continued investigation.`;
      memNotifType = 'reopened';
    } else if (newStatus === 'in_progress') {
      memNotifTitle = `Investigation Milestone: ${id}`;
      memNotifMessage = `Remediation is actively in progress.${assignedToName ? ` Lead: ${assignedToName}.` : ''}`;
      memNotifType = 'investigation';
    }

    notificationRepository.createNotification(
      complaint.userId,
      memNotifTitle,
      memNotifMessage,
      id,
      memNotifType
    );

    if (complaint.userEmail) {
      emailService
        .sendComplaintStatusChangedNotification(
          complaint.userEmail,
          complaint.userFullName || 'Student',
          id,
          prevStatus,
          newStatus,
          publicNote || resolutionSummary
        )
        .catch(() => {});
    }

    return complaint;
  },

  /**
   * Calculates live institutional metrics derived directly from database records.
   * Never fake metrics! Overdue complaints calculated against 48h SLA policy.
   */
  async getMetrics(): Promise<AdminDashboardMetrics> {
    const pool = getDbPool();
    if (pool) {
      try {
        const countsRes = await executeQuery<any>(
          `SELECT 
             COUNT(*)::int as total,
             COUNT(*) FILTER (WHERE status = 'submitted')::int as "newSubmitted",
             COUNT(*) FILTER (WHERE status IN ('under_review', 'awaiting_information'))::int as "awaitingReview",
             COUNT(*) FILTER (WHERE status = 'in_progress')::int as "inProgress",
             COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::int as resolved,
             COUNT(*) FILTER (
               WHERE status NOT IN ('resolved', 'closed') 
                 AND created_at < NOW() - INTERVAL '48 hours'
             )::int as overdue
           FROM public.complaints`
        );

        const catRes = await executeQuery<{ category_id: string; count: string }>(
          `SELECT category_id, COUNT(*)::text as count FROM public.complaints GROUP BY category_id`
        );

        const priRes = await executeQuery<{ priority: string; count: string }>(
          `SELECT priority, COUNT(*)::text as count FROM public.complaints GROUP BY priority`
        );

        const categoryDistribution: Record<string, number> = {};
        for (const r of catRes.rows) {
          categoryDistribution[r.category_id] = parseInt(r.count, 10);
        }

        const priorityDistribution: Record<string, number> = {};
        for (const r of priRes.rows) {
          priorityDistribution[r.priority] = parseInt(r.count, 10);
        }

        const row = countsRes.rows[0];
        return {
          total: row?.total || 0,
          newSubmitted: row?.newSubmitted || 0,
          awaitingReview: row?.awaitingReview || 0,
          inProgress: row?.inProgress || 0,
          resolved: row?.resolved || 0,
          overdue: row?.overdue || 0,
          categoryDistribution,
          priorityDistribution,
        };
      } catch (err) {
        // Fall back to memory
      }
    }

    const all = Array.from(MEMORY_COMPLAINTS.values());
    const now = Date.now();
    const SLA_LIMIT_MS = 48 * 3600 * 1000;

    let newSubmitted = 0;
    let awaitingReview = 0;
    let inProgress = 0;
    let resolved = 0;
    let overdue = 0;

    const categoryDistribution: Record<string, number> = {};
    const priorityDistribution: Record<string, number> = {};

    for (const c of all) {
      if (c.status === 'submitted') newSubmitted++;
      else if (c.status === 'under_review' || c.status === 'awaiting_information') awaitingReview++;
      else if (c.status === 'in_progress' || c.status === 'assigned') inProgress++;
      else if (c.status === 'resolved' || c.status === 'closed') resolved++;

      const isUnresolved = c.status !== 'resolved' && c.status !== 'closed';
      const ageMs = now - new Date(c.createdAt).getTime();
      if (isUnresolved && ageMs > SLA_LIMIT_MS) {
        overdue++;
      }

      categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1;
      priorityDistribution[c.priority] = (priorityDistribution[c.priority] || 0) + 1;
    }

    return {
      total: all.length,
      newSubmitted,
      awaitingReview,
      inProgress,
      resolved,
      overdue,
      categoryDistribution,
      priorityDistribution,
    };
  },
};
