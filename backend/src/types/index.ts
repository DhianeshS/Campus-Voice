export type UserRole = 'student' | 'admin' | 'staff';

export type ComplaintCategory =
  | 'academics'
  | 'faculty'
  | 'infrastructure'
  | 'hostel'
  | 'library'
  | 'transportation'
  | 'cleanliness'
  | 'it_services'
  | 'administration'
  | 'harassment_misconduct'
  | 'other'
  // Backward compatibility aliases
  | 'academic'
  | 'cafeteria'
  | 'security';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_information'
  | 'resolved'
  | 'closed'
  | 'reopened'
  // Backward compatibility alias
  | 'pending'
  | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  academicYear?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplaintAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface FollowUpPreferences {
  notificationMethod: 'email' | 'sms' | 'portal_only';
  contactPhone?: string;
  preferredContactTime?: 'morning' | 'afternoon' | 'anytime';
  isConfidential: boolean;
}

export interface TimelineEvent {
  id: string;
  status: ComplaintStatus;
  title: string;
  description: string;
  internalNote?: string; // Only visible to admin/staff; stripped for students
  actor: string;
  actorRole: UserRole | 'system';
  timestamp: string;
}

export interface Complaint {
  id: string; // e.g., 'CMP-2026-1042'
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  userId: string;
  userFullName?: string;
  userEmail?: string;
  department?: string;
  location?: string;
  attachments?: ComplaintAttachment[];
  attachmentUrls?: string[];
  followUpPreferences?: FollowUpPreferences;
  timeline?: TimelineEvent[];
  assignedTo?: string;
  assignedToName?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  isConfidential?: boolean;
  adminNotes?: Array<{ id: string; authorName: string; authorRole?: string; note: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: ComplaintCategory;
  name: string;
  description: string;
  department: string;
  defaultSlaHours?: number;
  isActive: boolean;
}

export interface Feedback {
  id: string;
  complaintId?: string;
  userId: string;
  userName?: string;
  feedbackType: 'complaint_resolution' | 'general_campus';
  category?: string;
  rating: number; // 1-5
  comment?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface FeedbackAggregateMetrics {
  averageRating: number;
  totalFeedback: number;
  resolutionFeedbackCount: number;
  generalFeedbackCount: number;
  ratingBreakdown: {
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
  recurringConcerns: {
    topic: string;
    occurrences: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    sampleFeedback: string;
  }[];
}

export interface StudentNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  complaintId?: string;
  read: boolean;
  createdAt: string;
  type: 'status_update' | 'investigation' | 'resolution' | 'system' | 'assignment' | 'info_requested' | 'reopened';
}

export interface ComplaintReportData {
  summary: {
    totalComplaints: number;
    resolvedComplaints: number;
    openComplaints: number;
    avgResolutionHours: number;
    medianResolutionHours: number;
    slaComplianceRate: number;
  };
  statusDistribution: { status: ComplaintStatus; count: number; percentage: number }[];
  categoryDistribution: { category: string; count: number; percentage: number }[];
  submissionsOverTime: { date: string; count: number }[];
  resolutionTimeDistribution: {
    under24Hours: number;
    oneToThreeDays: number;
    threeToSevenDays: number;
    overSevenDays: number;
  };
  departmentSummaries: {
    department: string;
    total: number;
    resolved: number;
    inProgress: number;
    avgResolutionHours: number;
    avgSatisfactionRating: number | null;
  }[];
  metadata: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    department?: string;
    generatedAt: string;
  };
}

export interface EmailDeliveryResult {
  success: boolean;
  provider: 'resend' | 'sendgrid' | 'smtp' | 'none';
  messageId?: string;
  deliveryStatus: 'delivered' | 'queued' | 'skipped_not_configured' | 'failed';
  error?: string;
  timestamp: string;
}

export interface AdminDashboardMetrics {
  total: number;
  newSubmitted: number;
  awaitingReview: number;
  inProgress: number;
  resolved: number;
  overdue: number; // Complaints open > 48 hours without resolution
  categoryDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  complaintId?: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface AdminStaffOfficer {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'admin' | 'staff';
  activeCases: number;
}

export interface AdminComplaintsQuery {
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
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    unread?: number;
    updatedCount?: number;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
}
