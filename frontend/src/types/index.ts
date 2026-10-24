export type UserRole = 'student' | 'admin' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  academicYear?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  academicYear: string;
  password: string;
  agreeToTerms: boolean;
}

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
  internalNote?: string;
  actor: string;
  actorRole: UserRole | 'system';
  timestamp: string;
}

export interface Complaint {
  id: string; // e.g. CMP-2026-1042
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
  createdAt: string;
  updatedAt: string;
  isDevFixture?: boolean;
}

export interface SystemHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  memoryUsageMb?: number;
  database?: {
    configured: boolean;
    provider: string;
  };
}

export interface CategoryInfo {
  id: ComplaintCategory;
  name: string;
  description: string;
  department: string;
  slaHours?: number;
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
  isPrivate?: boolean;
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

export interface DashboardSummary {
  total: number;
  open: number;
  underReview: number;
  resolved: number;
  rejected: number;
}

export interface StudentNotification {
  id: string;
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
  complaintRef?: string;
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
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  department?: string;
  assignedTo?: string;
  dateRange?: string;
  sortBy?: 'newest' | 'oldest' | 'priority' | 'updated';
  page?: number;
  limit?: number;
}
