import { AppError } from '../middleware/errorHandler';
import type { AuthenticatedUser } from '../middleware/auth';
import type { Feedback, FeedbackAggregateMetrics } from '../types';
import type { CreateFeedbackInput, AdminFeedbackQuery } from '../validators/feedback.validator';
import { feedbackRepository } from '../repositories/feedback.repository';
import { complaintRepository } from '../repositories/complaint.repository';
import { auditRepository } from '../repositories/audit.repository';

export const feedbackService = {
  /**
   * Submits student feedback (complaint resolution or general campus feedback).
   * Enforces ownership, status prerequisites, and 1-5 rating constraints.
   */
  async submitFeedback(input: CreateFeedbackInput, user: AuthenticatedUser): Promise<Feedback> {
    let resolvedCategory = input.category || 'general';

    // If attached to a complaint, verify complaint existence, ownership, and resolution status
    if (input.complaintId) {
      const complaint = await complaintRepository.getComplaintById(input.complaintId, user);
      if (!complaint) {
        throw new AppError(`Complaint with reference ${input.complaintId} not found.`, 404, 'NOT_FOUND');
      }

      // Strict Ownership Check
      if (complaint.userId !== user.id) {
        throw new AppError(
          'Security Violation: You can only provide resolution feedback on your own complaints.',
          403,
          'FORBIDDEN'
        );
      }

      // Resolution Check
      if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
        throw new AppError(
          'Feedback can only be provided on resolved or closed complaints.',
          400,
          'COMPLAINT_NOT_RESOLVED'
        );
      }

      resolvedCategory = complaint.category;
    }

    const feedback = await feedbackRepository.createFeedback({
      complaintId: input.complaintId,
      userId: user.id,
      userName: user.fullName || user.email.split('@')[0],
      feedbackType: input.feedbackType || (input.complaintId ? 'complaint_resolution' : 'general_campus'),
      category: resolvedCategory,
      rating: input.rating,
      comment: input.comment,
      isPrivate: input.isPrivate ?? true,
    });

    // Record audit event
    await auditRepository.recordAuditLog({
      complaintId: input.complaintId,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FEEDBACK_SUBMISSION',
      details: `Student submitted feedback with rating ${input.rating}/5 for ${
        input.complaintId ? `complaint ${input.complaintId}` : `category ${resolvedCategory}`
      }.`,
      newValue: `Rating: ${input.rating}`,
    });

    return feedback;
  },

  /**
   * Retrieves all feedback submitted by the currently authenticated student.
   * Enforces privacy and data isolation.
   */
  async getStudentFeedback(user: AuthenticatedUser): Promise<Feedback[]> {
    return feedbackRepository.getFeedbackByUserId(user.id);
  },

  /**
   * Lists feedback for administrators with date-range, category, and rating filters.
   */
  async listAdminFeedback(
    query: AdminFeedbackQuery,
    user: AuthenticatedUser
  ): Promise<{ feedback: Feedback[]; total: number; page: number; totalPages: number }> {
    if (user.role !== 'admin' && user.role !== 'staff') {
      throw new AppError('Only authorized staff or administrators may inspect feedback ledgers.', 403, 'FORBIDDEN');
    }

    return feedbackRepository.listFeedback(query);
  },

  /**
   * Computes live aggregate ratings and recurring concerns from actual student records.
   */
  async getFeedbackMetrics(
    filters: { category?: string; dateFrom?: string; dateTo?: string },
    user: AuthenticatedUser
  ): Promise<FeedbackAggregateMetrics> {
    if (user.role !== 'admin' && user.role !== 'staff') {
      throw new AppError('Only authorized administrators may access institutional feedback metrics.', 403, 'FORBIDDEN');
    }

    return feedbackRepository.getFeedbackAggregateMetrics(filters);
  },
};
