import { z } from 'zod';

export const complaintCategoryEnum = z.enum([
  'academics',
  'faculty',
  'infrastructure',
  'hostel',
  'library',
  'transportation',
  'cleanliness',
  'it_services',
  'administration',
  'harassment_misconduct',
  'other',
  // Backward compatibility
  'academic',
  'cafeteria',
  'security',
]);

export const complaintPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const complaintStatusEnum = z.enum([
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'awaiting_information',
  'resolved',
  'closed',
  'reopened',
  // Backward compatibility
  'pending',
  'rejected',
]);

// Permitted attachment MIME types whitelist for security
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const attachmentSchema = z.object({
  name: z.string().min(1, 'Attachment name is required').max(200),
  size: z
    .number()
    .positive('File size must be greater than 0 bytes')
    .max(10 * 1024 * 1024, 'Attachment exceeds institutional 10MB limit'),
  type: z.string().refine(
    (mime) => ALLOWED_ATTACHMENT_MIME_TYPES.includes(mime as any),
    {
      message:
        'Unsupported file type. Permitted formats: PDF, DOC, DOCX, TXT, JPEG, PNG, WEBP.',
    }
  ),
  url: z.string().min(1, 'Attachment URL/data is required'),
});

export const followUpPreferencesSchema = z.object({
  notificationMethod: z.enum(['email', 'sms', 'portal_only']).default('email'),
  contactPhone: z.string().max(20).optional(),
  preferredContactTime: z.enum(['morning', 'afternoon', 'anytime']).default('anytime'),
  isConfidential: z.boolean().default(false),
});

export const createComplaintSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title cannot exceed 150 characters')
    .trim(),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters')
    .max(3000, 'Description cannot exceed 3000 characters')
    .trim(),
  category: complaintCategoryEnum,
  priority: complaintPriorityEnum.default('medium'),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  attachments: z.array(attachmentSchema).max(5, 'Maximum of 5 attachments allowed').optional(),
  attachmentUrls: z.array(z.string()).max(5).optional(),
  followUpPreferences: followUpPreferencesSchema.optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: complaintStatusEnum,
  publicNote: z.string().max(1000, 'Public note cannot exceed 1000 characters').optional(),
  internalNote: z.string().max(1000, 'Internal note cannot exceed 1000 characters').optional(),
  assignedTo: z.string().uuid().optional(),
  assignedToName: z.string().max(100).optional(),
  resolutionSummary: z.string().max(2000).optional(),
});

export const queryComplaintSchema = z.object({
  category: complaintCategoryEnum.optional(),
  status: complaintStatusEnum.optional(),
  priority: complaintPriorityEnum.optional(),
  page: z.string().optional().transform((val) => {
    if (!val) return 1;
    const num = parseInt(val, 10);
    return Number.isFinite(num) && num >= 1 ? num : 1;
  }),
  limit: z.string().optional().transform((val) => {
    if (!val) return 20;
    const num = parseInt(val, 10);
    return Number.isFinite(num) && num >= 1 ? Math.min(100, num) : 20;
  }),
  search: z.string().optional(),
});

export const manageCategorySchema = z.object({
  id: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(300),
  department: z.string().min(2).max(100),
  isActive: z.boolean().default(true),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusSchema>;
export type QueryComplaintInput = z.infer<typeof queryComplaintSchema>;
export type ManageCategoryInput = z.infer<typeof manageCategorySchema>;
