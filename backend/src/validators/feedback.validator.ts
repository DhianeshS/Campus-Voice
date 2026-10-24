import { z } from 'zod';

export const createFeedbackSchema = z.object({
  complaintId: z.string().trim().optional(),
  feedbackType: z.enum(['complaint_resolution', 'general_campus']).default('complaint_resolution'),
  category: z.string().trim().max(100).optional(),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be an integer between 1 and 5')
    .max(5, 'Rating must be an integer between 1 and 5'),
  comment: z.string().max(2000, 'Comment cannot exceed 2000 characters').trim().optional(),
  isPrivate: z.boolean().default(true),
});

export const adminFeedbackQuerySchema = z.object({
  category: z.string().trim().optional(),
  feedbackType: z.enum(['all', 'complaint_resolution', 'general_campus']).optional(),
  dateFrom: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dateTo: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type AdminFeedbackQuery = z.infer<typeof adminFeedbackQuerySchema>;
