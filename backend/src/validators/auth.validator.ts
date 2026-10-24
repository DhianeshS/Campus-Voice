import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  studentId: z.string().max(50).trim().optional(),
  department: z.string().max(100).trim().optional(),
  phone: z.string().max(20).trim().optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
