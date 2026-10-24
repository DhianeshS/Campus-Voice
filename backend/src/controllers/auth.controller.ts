import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { profileRepository } from '../repositories/profile.repository';
import { updateProfileSchema } from '../validators/auth.validator';
import type { ApiResponse, UserProfile } from '../types';

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const profile = await profileRepository.getProfileById(req.user.id);
    const userProfile: UserProfile = profile || {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName || req.user.email.split('@')[0],
      role: req.user.role,
      studentId: req.user.studentId,
      department: req.user.department,
      createdAt: new Date().toISOString(),
    };

    const response: ApiResponse<UserProfile> = {
      success: true,
      data: userProfile,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const validatedInput = updateProfileSchema.parse(req.body);

    const existing = await profileRepository.getProfileById(req.user.id);
    const updatedProfile = await profileRepository.upsertProfile({
      id: req.user.id,
      email: req.user.email,
      fullName: validatedInput.fullName || existing?.fullName || req.user.fullName || 'Campus User',
      role: existing?.role || req.user.role, // Preserves role strictly! Students cannot alter roles.
      studentId: validatedInput.studentId !== undefined ? validatedInput.studentId : existing?.studentId,
      department: validatedInput.department !== undefined ? validatedInput.department : existing?.department,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response: ApiResponse<UserProfile> = {
      success: true,
      message: 'Profile updated successfully.',
      data: updatedProfile,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
