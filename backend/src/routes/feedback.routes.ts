import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { submissionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Student Endpoints (Enforces authentication and rate limiting)
router.post('/', requireAuth, submissionLimiter, feedbackController.submitFeedback);
router.get('/my', requireAuth, feedbackController.getMyFeedback);

// Administrator Feedback Endpoints (Enforces admin/staff RBAC)
router.get('/admin', requireAuth, requireRole(['admin', 'staff']), feedbackController.listAdminFeedback);
router.get(
  '/admin/metrics',
  requireAuth,
  requireRole(['admin', 'staff']),
  feedbackController.getFeedbackMetrics
);

export default router;
