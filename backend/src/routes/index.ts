import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import complaintRoutes from './complaint.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import feedbackRoutes from './feedback.routes';

const router = Router();

// Health check endpoint mounted at root level: /api/health
router.use('/health', healthRoutes);

// API v1 routes mounted at /api/v1/...
const v1Router = Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/complaints', complaintRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/feedback', feedbackRoutes);

router.use('/v1', v1Router);

export default router;
