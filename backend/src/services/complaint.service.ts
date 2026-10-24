import { AppError } from '../middleware/errorHandler';
import type { Complaint, CategoryInfo } from '../types';
import type {
  CreateComplaintInput,
  QueryComplaintInput,
  UpdateComplaintStatusInput,
  ManageCategoryInput,
} from '../validators/complaint.validator';
import type { AuthenticatedUser } from '../middleware/auth';
import { complaintRepository } from '../repositories/complaint.repository';
import { categoryRepository } from '../repositories/category.repository';

// In-memory idempotency cache for duplicate submission prevention (30-second window)
const recentSubmissions = new Map<string, number>();

export const complaintService = {
  /**
   * Retrieves active complaint categories.
   */
  async getCategories(): Promise<CategoryInfo[]> {
    return categoryRepository.listCategories();
  },

  /**
   * Registers or updates a complaint category. Restricted to administrators.
   */
  async manageCategory(input: ManageCategoryInput, user: AuthenticatedUser): Promise<CategoryInfo> {
    if (user.role !== 'admin') {
      throw new AppError('Only administrators can configure institutional categories.', 403, 'FORBIDDEN');
    }

    return categoryRepository.saveCategory({
      id: input.id as any,
      name: input.name,
      description: input.description,
      department: input.department,
      isActive: input.isActive,
    });
  },

  /**
   * Creates a new student complaint with duplicate submission prevention,
   * server-side atomic reference generation, and initial timeline logging.
   */
  async createComplaint(input: CreateComplaintInput, user: AuthenticatedUser): Promise<Complaint> {
    // 1. Duplicate submission prevention (Idempotency or 30-second window check)
    const idempotencyKey = input.idempotencyKey || `${user.id}:${input.title.toLowerCase().trim()}`;
    const lastSubmittedAt = recentSubmissions.get(idempotencyKey);
    const now = Date.now();

    if (lastSubmittedAt && now - lastSubmittedAt < 30000) {
      throw new AppError(
        'Duplicate submission detected. Please wait 30 seconds before submitting an identical grievance.',
        429,
        'DUPLICATE_SUBMISSION'
      );
    }
    recentSubmissions.set(idempotencyKey, now);

    return complaintRepository.createComplaint(
      {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority || 'medium',
        status: 'submitted',
        userId: user.id,
        userFullName: user.fullName || user.email.split('@')[0],
        userEmail: user.email,
        department: input.department,
        location: input.location,
        followUpPreferences: input.followUpPreferences || {
          notificationMethod: 'email',
          preferredContactTime: 'anytime',
          isConfidential: input.category === 'harassment_misconduct',
        },
        isConfidential: input.followUpPreferences?.isConfidential || input.category === 'harassment_misconduct',
      },
      input.attachments || [],
      user
    );
  },

  /**
   * Retrieves a single complaint with strict privacy enforcement and
   * separation of internal administrator notes from student views.
   */
  async getComplaintById(id: string, requestingUser: AuthenticatedUser): Promise<Complaint> {
    const complaint = await complaintRepository.getComplaintById(id, requestingUser);

    if (!complaint) {
      throw new AppError(`Complaint with reference ${id} not found`, 404, 'NOT_FOUND');
    }

    return complaint;
  },

  /**
   * Lists complaints with strict student-scoped data access.
   */
  async listComplaints(
    query: QueryComplaintInput,
    requestingUser: AuthenticatedUser
  ): Promise<{ complaints: Complaint[]; total: number; page?: number; totalPages?: number }> {
    return complaintRepository.listComplaints(query, requestingUser);
  },

  /**
   * Updates complaint status (restricted to Admin and Staff roles).
   * Appends an audit log event with support for separate public updates vs internal notes.
   */
  async updateComplaintStatus(
    id: string,
    input: UpdateComplaintStatusInput,
    adminUser: AuthenticatedUser
  ): Promise<Complaint> {
    if (adminUser.role === 'student') {
      throw new AppError('Students cannot modify administrative status fields.', 403, 'FORBIDDEN');
    }

    return complaintRepository.updateStatusTransaction(id, input.status, {
      publicNote: input.publicNote,
      internalNote: input.internalNote,
      assignedTo: input.assignedTo,
      assignedToName: input.assignedToName,
      resolutionSummary: input.resolutionSummary,
      actor: adminUser,
    });
  },
};
