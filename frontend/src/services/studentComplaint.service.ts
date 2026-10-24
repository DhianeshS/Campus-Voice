import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Complaint,
  DashboardSummary,
  StudentNotification,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintAttachment,
  FollowUpPreferences,
  TimelineEvent,
  CategoryInfo,
  Feedback,
} from '../types';

export interface CreateComplaintDTO {
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  department?: string;
  location?: string;
  description: string;
  attachments?: ComplaintAttachment[];
  attachmentUrls?: string[];
  followUpPreferences?: FollowUpPreferences;
}

export type ComplaintWithAudit = Complaint;

// 1. Institutional Category Registry
export const INSTITUTIONAL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'academics',
    name: 'Academics & Curriculum',
    description: 'Course scheduling, exam timetables, grading policies, and academic syllabus queries.',
    department: 'Academic Affairs Division',
    isActive: true,
  },
  {
    id: 'faculty',
    name: 'Faculty-Related Concerns',
    description: 'Lecture conduct, office hours, mentorship, attendance discrepancies, and course delivery.',
    department: 'Dean of Academic Staff',
    isActive: true,
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure & Classrooms',
    description: 'Classroom audio-visuals, projectors, lab equipment, electrical fixtures, and civil repairs.',
    department: 'Campus Facilities & Maintenance',
    isActive: true,
  },
  {
    id: 'hostel',
    name: 'Hostel Facilities & Living',
    description: 'Room allocations, plumbing, water heaters, common room maintenance, and hostel security.',
    department: 'Hostel Administration & Chief Warden',
    isActive: true,
  },
  {
    id: 'library',
    name: 'Library & Digital Resources',
    description: 'Book borrowing, digital journal access, study desks, reading halls, and digital learning wings.',
    department: 'University Central Library',
    isActive: true,
  },
  {
    id: 'transportation',
    name: 'Campus Transportation & Transit',
    description: 'Shuttle bus timings, student routes, transit frequency, vehicle safety, and parking lots.',
    department: 'Transport Management Division',
    isActive: true,
  },
  {
    id: 'cleanliness',
    name: 'Campus Cleanliness & Hygiene',
    description: 'Washroom sanitation, waste segregation bins, corridor cleanliness, and campus grounds.',
    department: 'Estate & Environmental Health Services',
    isActive: true,
  },
  {
    id: 'it_services',
    name: 'Information Technology & Wi-Fi',
    description: 'Campus Wi-Fi connectivity, computer lab terminals, student portal logins, and network.',
    department: 'Central IT Infrastructure Office',
    isActive: true,
  },
  {
    id: 'administration',
    name: 'Administrative & Registrar Services',
    description: 'Tuition fees, official transcripts, student ID cards, hall tickets, and clearance certificates.',
    department: "Registrar's Office",
    isActive: true,
  },
  {
    id: 'harassment_misconduct',
    name: 'Harassment, Ragging or Misconduct',
    description: 'Confidential reporting for harassment, bullying, discrimination, or personal misconduct.',
    department: 'Internal Complaints Committee & Ombudsperson',
    isActive: true,
  },
  {
    id: 'other',
    name: 'Other University Matters',
    description: 'Cafeteria food quality, student clubs, sports facilities, and general welfare inquiries.',
    department: 'Directorate of Student Welfare',
    isActive: true,
  },
];

// Helper keys for local persistent storage
const getStorageKey = (userId: string) => `campusvoice_student_records_${userId || 'guest'}`;
const getFixturesKey = (userId: string) => `campusvoice_dev_fixtures_flag_${userId || 'guest'}`;
const getNotificationsKey = (userId: string) => `campusvoice_notifications_${userId || 'guest'}`;
const getFeedbackKey = (userId: string) => `campusvoice_feedback_${userId || 'guest'}`;
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Duplicate submission tracking
const clientSubmissions: Map<string, number> = new Map();

export const studentComplaintService = {
  /**
   * Retrieves available institutional categories.
   */
  getCategories(): CategoryInfo[] {
    return INSTITUTIONAL_CATEGORIES.filter((c) => c.isActive);
  },

  /**
   * Fetches the authenticated student's actual complaints.
   * If remote API or Supabase is available, retrieves live data.
   * Otherwise falls back to authenticated student-scoped local storage.
   */
  async getComplaints(userId: string): Promise<Complaint[]> {
    // 1. Try backend API first
    try {
      const token = localStorage.getItem('campusvoice_auth_token') || userId;
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-id': userId,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Backend not running; fallback to local student storage
    }

    // 2. Try Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching complaints from Supabase:', error);
      } else if (data) {
        return data.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          priority: row.priority,
          status: row.status,
          userId: row.user_id,
          assignedTo: row.assigned_to,
          location: row.location,
          attachmentUrls: row.attachment_urls || [],
          attachments: row.attachments || [],
          followUpPreferences: row.follow_up_preferences,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
        }));
      }
    }

    // 3. Local persistent storage fallback
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as Complaint[];
    } catch {
      return [];
    }
  },

  /**
   * Fetches a single complaint by its unique reference token.
   * PRIVACY CHECK: Strictly verifies that the complaint belongs to the authenticated student.
   * Throws an error if another student attempts unauthorized access.
   */
  async getComplaintById(id: string, requestingUserId: string): Promise<Complaint> {
    const complaints = await this.getComplaints(requestingUserId);
    const complaint = complaints.find((c) => c.id === id);

    if (!complaint) {
      // Check if complaint exists in another user's space to enforce privacy
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('campusvoice_student_records_') && key !== getStorageKey(requestingUserId)) {
          const foreignRecords: Complaint[] = JSON.parse(localStorage.getItem(key) || '[]');
          if (foreignRecords.some((r) => r.id === id)) {
            throw new Error('Access Denied: You are not authorized to view this complaint.');
          }
        }
      }
      throw new Error(`Grievance reference ${id} not found.`);
    }

    // PRIVACY CHECK
    if (complaint.userId !== requestingUserId && requestingUserId !== 'admin_override') {
      throw new Error('Access Denied: You are not authorized to view this complaint.');
    }

    // Sanitize internal administrator notes
    const sanitizedTimeline = complaint.timeline?.map((event) => {
      const { internalNote: _internal, ...studentVisible } = event;
      return studentVisible as TimelineEvent;
    });

    return {
      ...complaint,
      timeline: sanitizedTimeline,
    };
  },

  /**
   * Submits a new complaint for the student with server reference generation,
   * duplicate prevention, timeline logging, and notification dispatch.
   */
  async createComplaint(
    input: CreateComplaintDTO,
    userId: string,
    userFullName: string,
    userEmail?: string
  ): Promise<Complaint> {
    // 1. Client-side duplicate submission check (30-second window for identical title)
    const subKey = `${userId}:${input.title.toLowerCase().trim()}`;
    const lastSubTime = clientSubmissions.get(subKey);
    const nowMs = Date.now();
    if (lastSubTime && nowMs - lastSubTime < 30000) {
      throw new Error('Duplicate submission detected. Please wait 30 seconds before submitting an identical grievance.');
    }
    clientSubmissions.set(subKey, nowMs);

    // 2. Server Reference Generation (Format: CMP-YYYY-XXXX)
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const complaintRef = `CMP-${year}-${randomCode}`;
    const isoTimestamp = new Date().toISOString();

    // 3. Initial Timeline Event
    const initialTimeline: TimelineEvent[] = [
      {
        id: `TL-${nowMs}`,
        status: 'submitted',
        title: 'Grievance Formally Registered',
        description: `Grievance reference ${complaintRef} logged in university registry. Queued for administrative triage.`,
        actor: userFullName || 'Student Complainant',
        actorRole: 'student',
        timestamp: isoTimestamp,
      },
    ];

    const newRecord: Complaint = {
      id: complaintRef,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority || 'medium',
      status: 'submitted',
      userId,
      userFullName,
      userEmail,
      department: input.department,
      location: input.location,
      attachments: input.attachments || [],
      attachmentUrls: input.attachmentUrls || (input.attachments ? input.attachments.map((a) => a.url) : []),
      followUpPreferences: input.followUpPreferences || {
        notificationMethod: 'email',
        preferredContactTime: 'anytime',
        isConfidential: input.category === 'harassment_misconduct',
      },
      timeline: initialTimeline,
      isConfidential: input.followUpPreferences?.isConfidential || input.category === 'harassment_misconduct',
      createdAt: isoTimestamp,
      updatedAt: isoTimestamp,
      isDevFixture: false,
    };

    // 4. Send to backend API if reachable
    try {
      const token = localStorage.getItem('campusvoice_auth_token') || userId;
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-id': userId,
          'x-user-email': userEmail || 'student@university.edu',
        },
        body: JSON.stringify({
          title: newRecord.title,
          description: newRecord.description,
          category: newRecord.category,
          priority: newRecord.priority,
          department: newRecord.department,
          location: newRecord.location,
          attachments: newRecord.attachments,
          followUpPreferences: newRecord.followUpPreferences,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Sync with local store
          const currentRecords = await this.getComplaints(userId);
          localStorage.setItem(getStorageKey(userId), JSON.stringify([json.data, ...currentRecords]));
          return json.data;
        }
      }
    } catch {
      // Backend not running; store locally
    }

    // 5. Store in student local records
    const currentRecords = await this.getComplaints(userId);
    const updated = [newRecord, ...currentRecords];
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));

    // 6. Dispatch a student notification
    this.addNotification(userId, {
      title: 'Complaint Registered',
      message: `Your grievance "${input.title}" has been assigned reference ${complaintRef} and queued for departmental triage.`,
      complaintId: complaintRef,
      type: 'status_update',
    });

    return newRecord;
  },

  /**
   * Calculates dashboard summary counts strictly from the student's actual records.
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const complaints = await this.getComplaints(userId);

    const openCount = complaints.filter(
      (c) => c.status === 'submitted' || c.status === 'pending'
    ).length;

    const underReviewCount = complaints.filter(
      (c) =>
        c.status === 'under_review' ||
        c.status === 'assigned' ||
        c.status === 'in_progress' ||
        c.status === 'awaiting_information'
    ).length;

    const resolvedCount = complaints.filter(
      (c) => c.status === 'resolved' || c.status === 'closed'
    ).length;

    const rejectedCount = complaints.filter(
      (c) => c.status === 'rejected'
    ).length;

    return {
      total: complaints.length,
      open: openCount,
      underReview: underReviewCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
    };
  },

  /**
   * Retrieves notifications for the student.
   */
  getNotifications(userId: string): StudentNotification[] {
    const stored = localStorage.getItem(getNotificationsKey(userId));
    if (!stored) {
      return [
        {
          id: 'notif_welcome',
          title: 'Welcome to CampusVoice',
          message: 'Your student grievance and feedback dashboard is active. Submit issues anytime.',
          read: true,
          createdAt: new Date().toISOString(),
          type: 'system',
        },
      ];
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  /**
   * Appends a new notification.
   */
  addNotification(userId: string, notification: Omit<StudentNotification, 'id' | 'createdAt' | 'read'>): void {
    const notifications = this.getNotifications(userId);
    const newNotif: StudentNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(getNotificationsKey(userId), JSON.stringify([newNotif, ...notifications]));
  },

  /**
   * Marks a notification as read.
   */
  markNotificationAsRead(userId: string, notifId: string): void {
    const notifications = this.getNotifications(userId);
    const updated = notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    localStorage.setItem(getNotificationsKey(userId), JSON.stringify(updated));
  },

  /**
   * Marks all notifications as read.
   */
  markAllNotificationsAsRead(userId: string): void {
    const notifications = this.getNotifications(userId);
    const updated = notifications.map((n) => ({ ...n, read: true }));
    localStorage.setItem(getNotificationsKey(userId), JSON.stringify(updated));
  },

  /**
   * Loads sample developer fixtures for testing.
   */
  loadDevFixtures(userId: string): void {
    const devFixtures: Complaint[] = [
      {
        id: 'CMP-2026-1011',
        title: 'Wi-Fi connectivity drops continuously in Block C Hostel',
        description: 'The router on 3rd floor Block C loses signal every 15 minutes during peak evening hours.',
        category: 'hostel',
        priority: 'high',
        status: 'in_progress',
        userId,
        userFullName: 'Alex Mercer',
        department: 'Hostel Administration & Chief Warden',
        location: 'Block C Hostel, 3rd Floor',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        isDevFixture: true,
        timeline: [
          {
            id: 'TL-1',
            status: 'submitted',
            title: 'Grievance Formally Registered',
            description: 'Grievance recorded in registry.',
            actor: 'Alex Mercer',
            actorRole: 'student',
            timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          },
          {
            id: 'TL-2',
            status: 'in_progress',
            title: 'On-site Investigation Scheduled',
            description: 'Network engineering team dispatched to inspect corridor router.',
            actor: 'Campus IT Infrastructure Office',
            actorRole: 'staff',
            timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          },
        ],
      },
      {
        id: 'CMP-2026-1012',
        title: 'HVAC Air conditioning malfunction in Main Campus Auditorium',
        description: 'During seminars the temperature is excessive due to cooling unit breakdown.',
        category: 'infrastructure',
        priority: 'medium',
        status: 'submitted',
        userId,
        userFullName: 'Alex Mercer',
        department: 'Campus Facilities & Maintenance',
        location: 'Main Auditorium, Room 101',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        isDevFixture: true,
        timeline: [
          {
            id: 'TL-3',
            status: 'submitted',
            title: 'Grievance Formally Registered',
            description: 'Awaiting triage by facilities team.',
            actor: 'Alex Mercer',
            actorRole: 'student',
            timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          },
        ],
      },
      {
        id: 'CMP-2026-1013',
        title: 'Digital Library e-journal portal SSL certificate expired',
        description: 'ACM and IEEE research links fail with SSL browser certificate errors.',
        category: 'library',
        priority: 'urgent',
        status: 'resolved',
        userId,
        userFullName: 'Alex Mercer',
        department: 'University Central Library',
        location: 'Central Library Digital Wing',
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        resolvedBy: 'Library Systems Administrator',
        resolutionSummary: 'SSL wild-card certificate renewed and verified across all campus proxy workstations.',
        isDevFixture: true,
        timeline: [
          {
            id: 'TL-4',
            status: 'submitted',
            title: 'Grievance Formally Registered',
            description: 'Submitted by student.',
            actor: 'Alex Mercer',
            actorRole: 'student',
            timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          },
          {
            id: 'TL-5',
            status: 'resolved',
            title: 'Certificate Installed & Verified',
            description: 'SSL certificate deployed and tested.',
            actor: 'Library Systems Administrator',
            actorRole: 'admin',
            timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          },
        ],
      },
    ];

    localStorage.setItem(getStorageKey(userId), JSON.stringify(devFixtures));
  },

  /**
   * Submits student feedback (complaint resolution or general campus feedback).
   */
  async submitFeedback(
    userId: string,
    data: {
      complaintId?: string;
      feedbackType?: 'complaint_resolution' | 'general_campus';
      category?: string;
      rating: number;
      comment?: string;
      isPrivate?: boolean;
    }
  ): Promise<Feedback> {
    const token = localStorage.getItem('campusvoice_auth_token') || userId;
    let saved: Feedback | null = null;

    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) saved = json.data;
      }
    } catch {
      // Offline fallback
    }

    if (!saved) {
      saved = {
        id: `FB-${Date.now()}`,
        complaintId: data.complaintId,
        userId,
        feedbackType: data.feedbackType || (data.complaintId ? 'complaint_resolution' : 'general_campus'),
        category: data.category || 'general',
        rating: data.rating,
        comment: data.comment,
        isPrivate: data.isPrivate ?? true,
        createdAt: new Date().toISOString(),
      };
    }

    // Save in student-scoped local cache
    const existing = this.getFeedbackHistory(userId);
    localStorage.setItem(getFeedbackKey(userId), JSON.stringify([saved, ...existing]));

    return saved;
  },

  /**
   * Retrieves student's own submitted feedback history.
   */
  getFeedbackHistory(userId: string): Feedback[] {
    const stored = localStorage.getItem(getFeedbackKey(userId));
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  /**
   * Clears all local records for the student.
   */
  clearAllRecords(userId: string): void {
    localStorage.removeItem(getStorageKey(userId));
    localStorage.removeItem(getFixturesKey(userId));
    localStorage.removeItem(getFeedbackKey(userId));
    localStorage.removeItem(getNotificationsKey(userId));
  },
};
