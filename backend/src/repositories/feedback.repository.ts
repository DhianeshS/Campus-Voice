import { executeQuery, getDbPool } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import type { Feedback, FeedbackAggregateMetrics } from '../types';
import type { AdminFeedbackQuery } from '../validators/feedback.validator';

const MEMORY_FEEDBACK = new Map<string, Feedback>();

// Keywords used for analyzing recurring concerns from real student comments
const RECURRING_THEME_KEYWORDS: Record<string, string[]> = {
  'Wi-Fi & Network Stability': ['wifi', 'wi-fi', 'internet', 'connection', 'network', 'signal', 'speed', 'router'],
  'Hostel Water & Heating': ['water', 'plumbing', 'heater', 'hot water', 'cold', 'tap', 'leak', 'drainage'],
  'Air Conditioning & Ventilation': ['ac', 'air conditioning', 'cooling', 'ventilation', 'temperature', 'fan', 'hvac'],
  'Classroom AV Equipment': ['projector', 'audio', 'mic', 'screen', 'hdmi', 'speaker', 'presentation'],
  'Campus Cleanliness & Hygiene': ['clean', 'cleanliness', 'hygiene', 'trash', 'dustbin', 'washroom', 'sanitation'],
  'Cafeteria Food Quality': ['food', 'cafeteria', 'mess', 'canteen', 'meal', 'taste', 'quality', 'hygiene'],
  'Resolution Timeliness': ['slow', 'delay', 'delayed', 'quick', 'fast', 'prompt', 'waiting', 'hours', 'days'],
};

export const feedbackRepository = {
  /**
   * Submits student feedback (complaint resolution or general campus feedback).
   */
  async createFeedback(data: {
    complaintId?: string;
    userId: string;
    userName?: string;
    feedbackType?: 'complaint_resolution' | 'general_campus';
    category?: string;
    rating: number;
    comment?: string;
    isPrivate?: boolean;
  }): Promise<Feedback> {
    const {
      complaintId,
      userId,
      userName,
      feedbackType = complaintId ? 'complaint_resolution' : 'general_campus',
      category = 'general',
      rating,
      comment,
      isPrivate = true,
    } = data;

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be an integer between 1 and 5.', 400, 'INVALID_RATING');
    }

    const id = `FDB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `INSERT INTO public.feedback (id, complaint_id, user_id, feedback_type, category, rating, comment, is_private, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           RETURNING id, complaint_id as "complaintId", user_id as "userId", feedback_type as "feedbackType",
                     category, rating, comment, is_private as "isPrivate", created_at as "createdAt"`,
          [id, complaintId || null, userId, feedbackType, category, rating, comment?.trim() || null, isPrivate]
        );
        if (res.rows.length > 0) {
          const fb = { ...res.rows[0], userName };
          MEMORY_FEEDBACK.set(id, fb);
          return fb;
        }
      } catch (err: any) {
        if (err.code === '23505' || err.statusCode === 409) {
          throw new AppError('Feedback has already been recorded for this grievance.', 409, 'FEEDBACK_EXISTS');
        }
        // Fall back to memory
      }
    }

    // In-memory check for unique complaint feedback
    if (complaintId) {
      const existing = Array.from(MEMORY_FEEDBACK.values()).find(
        (f) => f.complaintId === complaintId && f.userId === userId
      );
      if (existing) {
        throw new AppError('Feedback has already been recorded for this grievance.', 409, 'FEEDBACK_EXISTS');
      }
    }

    const newFeedback: Feedback = {
      id,
      complaintId,
      userId,
      userName,
      feedbackType,
      category,
      rating,
      comment: comment?.trim(),
      isPrivate,
      createdAt: now,
    };

    MEMORY_FEEDBACK.set(id, newFeedback);
    return newFeedback;
  },

  /**
   * Retrieves a student's own submitted feedback records.
   */
  async getFeedbackByUserId(userId: string): Promise<Feedback[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT f.id, f.complaint_id as "complaintId", f.user_id as "userId", f.feedback_type as "feedbackType",
                  f.category, f.rating, f.comment, f.is_private as "isPrivate", f.created_at as "createdAt",
                  p.full_name as "userName"
           FROM public.feedback f
           LEFT JOIN public.profiles p ON f.user_id = p.id
           WHERE f.user_id = $1
           ORDER BY f.created_at DESC`,
          [userId]
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        // Fall back to memory
      }
    }

    return Array.from(MEMORY_FEEDBACK.values())
      .filter((f) => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Retrieves feedback specifically for a complaint.
   */
  async getFeedbackByComplaintId(complaintId: string): Promise<Feedback | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await executeQuery<any>(
          `SELECT id, complaint_id as "complaintId", user_id as "userId", feedback_type as "feedbackType",
                  category, rating, comment, is_private as "isPrivate", created_at as "createdAt"
           FROM public.feedback
           WHERE complaint_id = $1`,
          [complaintId]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        // Fall back to memory
      }
    }

    return Array.from(MEMORY_FEEDBACK.values()).find((f) => f.complaintId === complaintId) || null;
  },

  /**
   * Lists feedback for administrators with filters, pagination, and date range.
   */
  async listFeedback(
    query: AdminFeedbackQuery
  ): Promise<{ feedback: Feedback[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const offset = (page - 1) * limit;

    const pool = getDbPool();
    if (pool) {
      try {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (query.category && query.category !== 'all') {
          conditions.push(`f.category = $${idx++}`);
          params.push(query.category);
        }
        if (query.feedbackType && query.feedbackType !== 'all') {
          conditions.push(`f.feedback_type = $${idx++}`);
          params.push(query.feedbackType);
        }
        if (query.dateFrom) {
          conditions.push(`f.created_at >= $${idx++}`);
          params.push(new Date(query.dateFrom));
        }
        if (query.dateTo) {
          conditions.push(`f.created_at <= $${idx++}`);
          params.push(new Date(query.dateTo));
        }
        if (query.minRating) {
          conditions.push(`f.rating >= $${idx++}`);
          params.push(query.minRating);
        }
        if (query.maxRating) {
          conditions.push(`f.rating <= $${idx++}`);
          params.push(query.maxRating);
        }
        if (query.search && query.search.trim()) {
          conditions.push(`f.comment ILIKE $${idx++}`);
          params.push(`%${query.search.trim()}%`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countRes = await executeQuery<{ count: string }>(
          `SELECT COUNT(*) as count FROM public.feedback f ${whereSql}`,
          params
        );
        const total = parseInt(countRes.rows[0]?.count || '0', 10);
        const totalPages = Math.ceil(total / limit) || 1;

        params.push(limit, offset);
        const dataRes = await executeQuery<any>(
          `SELECT f.id, f.complaint_id as "complaintId", f.user_id as "userId", f.feedback_type as "feedbackType",
                  f.category, f.rating, f.comment, f.is_private as "isPrivate", f.created_at as "createdAt",
                  p.full_name as "userName"
           FROM public.feedback f
           LEFT JOIN public.profiles p ON f.user_id = p.id
           ${whereSql}
           ORDER BY f.created_at DESC
           LIMIT $${idx++} OFFSET $${idx++}`,
          params
        );

        return { feedback: dataRes.rows, total, page, totalPages };
      } catch (err) {
        // Fall back to memory
      }
    }

    // Memory Store Implementation
    let all = Array.from(MEMORY_FEEDBACK.values());

    if (query.category && query.category !== 'all') {
      all = all.filter((f) => f.category?.toLowerCase() === query.category?.toLowerCase());
    }
    if (query.feedbackType && query.feedbackType !== 'all') {
      all = all.filter((f) => f.feedbackType === query.feedbackType);
    }
    if (query.dateFrom) {
      const from = new Date(query.dateFrom).getTime();
      all = all.filter((f) => new Date(f.createdAt).getTime() >= from);
    }
    if (query.dateTo) {
      const to = new Date(query.dateTo).getTime();
      all = all.filter((f) => new Date(f.createdAt).getTime() <= to);
    }
    if (query.minRating) {
      all = all.filter((f) => f.rating >= query.minRating!);
    }
    if (query.maxRating) {
      all = all.filter((f) => f.rating <= query.maxRating!);
    }
    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      all = all.filter((f) => f.comment?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q));
    }

    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = all.slice(offset, offset + limit);

    return { feedback: paginated, total, page, totalPages };
  },

  /**
   * Computes live aggregate metrics and recurring concern analysis.
   */
  async getFeedbackAggregateMetrics(filters?: {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<FeedbackAggregateMetrics> {
    const { feedback } = await this.listFeedback({
      category: filters?.category,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      page: 1,
      limit: 1000,
    });

    const totalFeedback = feedback.length;
    if (totalFeedback === 0) {
      return {
        averageRating: 0,
        totalFeedback: 0,
        resolutionFeedbackCount: 0,
        generalFeedbackCount: 0,
        ratingBreakdown: { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 },
        recurringConcerns: [],
      };
    }

    const ratingBreakdown = { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 };
    let sumRating = 0;
    let resolutionCount = 0;
    let generalCount = 0;

    feedback.forEach((f) => {
      sumRating += f.rating;
      if (f.rating === 5) ratingBreakdown.star5++;
      else if (f.rating === 4) ratingBreakdown.star4++;
      else if (f.rating === 3) ratingBreakdown.star3++;
      else if (f.rating === 2) ratingBreakdown.star2++;
      else if (f.rating === 1) ratingBreakdown.star1++;

      if (f.feedbackType === 'general_campus') generalCount++;
      else resolutionCount++;
    });

    const averageRating = Number((sumRating / totalFeedback).toFixed(2));

    // Analyze Recurring Concerns from actual student comments
    const themeCounts: Record<string, { count: number; sample: string; sentimentScore: number }> = {};
    for (const [theme, keywords] of Object.entries(RECURRING_THEME_KEYWORDS)) {
      themeCounts[theme] = { count: 0, sample: '', sentimentScore: 0 };
      for (const item of feedback) {
        if (!item.comment) continue;
        const commentLower = item.comment.toLowerCase();
        const matches = keywords.some((kw) => commentLower.includes(kw));
        if (matches) {
          themeCounts[theme].count++;
          themeCounts[theme].sentimentScore += item.rating;
          if (!themeCounts[theme].sample) {
            themeCounts[theme].sample = item.comment;
          }
        }
      }
    }

    const recurringConcerns = Object.entries(themeCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([topic, data]) => {
        const avgScore = data.sentimentScore / data.count;
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (avgScore >= 3.8) sentiment = 'positive';
        else if (avgScore <= 2.5) sentiment = 'negative';

        return {
          topic,
          occurrences: data.count,
          sentiment,
          sampleFeedback: data.sample,
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences);

    return {
      averageRating,
      totalFeedback,
      resolutionFeedbackCount: resolutionCount,
      generalFeedbackCount: generalCount,
      ratingBreakdown,
      recurringConcerns,
    };
  },
};
