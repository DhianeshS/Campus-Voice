import { AppError } from '../middleware/errorHandler';
import type {
  Complaint,
  ComplaintStatus,
  AdminDashboardMetrics,
  AuditLogEntry,
  AdminStaffOfficer,
  UserProfile,
  UserRole,
  AdminComplaintsQuery,
} from '../types';
import type { AuthenticatedUser } from '../middleware/auth';
import { complaintRepository } from '../repositories/complaint.repository';
import { profileRepository } from '../repositories/profile.repository';
import { auditRepository } from '../repositories/audit.repository';

// Authorized institutional officers available for assignment
const DEFAULT_OFFICERS: AdminStaffOfficer[] = [
  {
    id: 'off_01',
    name: 'Dr. Evelyn Vance',
    email: 'evelyn.vance@university.edu',
    department: 'University Ombudsman & Grievance Directorate',
    role: 'admin',
    activeCases: 4,
  },
  {
    id: 'off_02',
    name: 'Prof. Rajesh Kulkarni',
    email: 'r.kulkarni@university.edu',
    department: 'Academic Affairs Division',
    role: 'staff',
    activeCases: 6,
  },
  {
    id: 'off_03',
    name: 'Dr. Anita Desai',
    email: 'anita.desai@university.edu',
    department: 'Internal Complaints Committee (ICC Chair)',
    role: 'admin',
    activeCases: 2,
  },
  {
    id: 'off_04',
    name: 'Col. Marcus Sterling (Retd.)',
    email: 'm.sterling@university.edu',
    department: 'Hostel Administration & Chief Warden',
    role: 'staff',
    activeCases: 5,
  },
  {
    id: 'off_05',
    name: 'Engr. David Chen',
    email: 'david.chen@university.edu',
    department: 'Campus Facilities & Civil Works',
    role: 'staff',
    activeCases: 7,
  },
  {
    id: 'off_06',
    name: 'Vikram Joshi',
    email: 'v.joshi@university.edu',
    department: 'IT Infrastructure & Digital Campus',
    role: 'staff',
    activeCases: 3,
  },
];

export const adminService = {
  /**
   * Retrieves real database-derived dashboard counts. Never fake metrics!
   */
  async getMetrics(): Promise<AdminDashboardMetrics> {
    return complaintRepository.getMetrics();
  },

  /**
   * Retrieves full complaints list with multi-criteria server-side filtering,
   * search, sorting, and pagination.
   */
  async getComplaints(
    query: AdminComplaintsQuery,
    adminUser: AuthenticatedUser
  ): Promise<{ complaints: Complaint[]; total: number; page: number; totalPages: number }> {
    return complaintRepository.listComplaints(query, adminUser);
  },

  /**
   * Assigns complaint to a departmental officer.
   */
  async assignComplaint(
    id: string,
    officerId: string,
    officerName: string,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    const complaint = await complaintRepository.getComplaintById(id, adminUser);
    if (!complaint) throw new AppError(`Complaint ${id} not found.`, 404, 'NOT_FOUND');

    const nextStatus = complaint.status === 'submitted' || complaint.status === 'pending' ? 'assigned' : complaint.status;
    return complaintRepository.updateStatusTransaction(id, nextStatus, {
      assignedTo: officerId,
      assignedToName: officerName,
      publicNote: `Assigned to ${officerName} for departmental investigation.`,
      actor: adminUser,
    });
  },

  /**
   * Updates complaint status milestone and records staff internal notes.
   */
  async updateStatus(
    id: string,
    newStatus: ComplaintStatus,
    publicNote: string,
    internalNote: string,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    return complaintRepository.updateStatusTransaction(id, newStatus, {
      publicNote: publicNote || undefined,
      internalNote: internalNote || undefined,
      actor: adminUser,
    });
  },

  /**
   * Requests additional clarification from the student complainant.
   */
  async requestInfo(
    id: string,
    clarificationMessage: string,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    return complaintRepository.updateStatusTransaction(id, 'awaiting_information', {
      publicNote: `Clarification requested: "${clarificationMessage}".`,
      actor: adminUser,
    });
  },

  /**
   * Records a formal resolution with remediation summary.
   */
  async resolveComplaint(
    id: string,
    resolutionSummary: string,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    if (!resolutionSummary || !resolutionSummary.trim()) {
      throw new AppError('Resolution summary is required to close a grievance.', 400, 'BAD_REQUEST');
    }

    return complaintRepository.updateStatusTransaction(id, 'resolved', {
      resolutionSummary: resolutionSummary.trim(),
      publicNote: `Resolution recorded: ${resolutionSummary.trim()}`,
      actor: adminUser,
    });
  },

  /**
   * Formally closes a complaint.
   */
  async closeComplaint(
    id: string,
    closureReason: string,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    return complaintRepository.updateStatusTransaction(id, 'closed', {
      publicNote: closureReason.trim() || 'Grievance matter has reached conclusion and is formally archived.',
      actor: adminUser,
    });
  },

  /**
   * Reopens an archived or closed complaint.
   */
  async reopenComplaint(
    id: string,
    reopenReason: string,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    return complaintRepository.updateStatusTransaction(id, 'reopened', {
      publicNote: reopenReason.trim() || 'Case reopened based on additional evidence or student appeal.',
      actor: adminUser,
    });
  },

  /**
   * Retrieves registered user profiles for user management.
   */
  async getUsers(search?: string, roleFilter?: string): Promise<UserProfile[]> {
    return profileRepository.listUsers(search, roleFilter);
  },

  /**
   * Updates user role with strict SELF-ESCALATION PREVENTION.
   * Requirement 6: "Never allow an administrator to escalate their own privileges."
   */
  async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    adminUser: AuthenticatedUser
  ): Promise<UserProfile> {
    // 1. Role Authorization Check: Only admins can change roles
    if (adminUser.role !== 'admin') {
      throw new AppError('Only authorized System Administrators can modify user roles.', 403, 'FORBIDDEN');
    }

    // 2. SELF-ESCALATION PREVENTION: Never allow an administrator to modify their own role
    if (targetUserId === adminUser.id) {
      throw new AppError(
        'Security Violation: Administrators are strictly prohibited from escalating or modifying their own privilege level.',
        403,
        'FORBIDDEN'
      );
    }

    const updated = await profileRepository.updateUserRole(targetUserId, newRole);

    await auditRepository.recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'ROLE_CHANGED',
      details: `Changed role of user ${updated.fullName} (${updated.email}) to ${newRole}.`,
      newValue: newRole,
    });

    return updated;
  },

  /**
   * Retrieves append-only institutional audit logs.
   */
  async getAuditLogs(actionFilter?: string): Promise<AuditLogEntry[]> {
    return auditRepository.getAuditLogs(actionFilter);
  },

  /**
   * Retrieves list of available officers for case assignment.
   */
  getOfficers(): AdminStaffOfficer[] {
    return DEFAULT_OFFICERS;
  },
};
