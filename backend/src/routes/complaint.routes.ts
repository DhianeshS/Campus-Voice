import { Router } from 'express';
import {
  listComplaints,
  createComplaint,
  getComplaintDetails,
  getComplaintHistory,
  submitFeedback,
  getCategories,
  manageCategory,
  updateComplaintStatus,
} from '../controllers/complaint.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { submissionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public/Auth routes
router.get('/categories', getCategories);

// Authenticated routes
router.use(requireAuth);

router.get('/', listComplaints);
router.post('/', submissionLimiter, createComplaint);
router.get('/:id', getComplaintDetails);
router.get('/:id/history', getComplaintHistory);
router.post('/:id/feedback', submissionLimiter, submitFeedback);

// Administrative routes
router.post('/categories', requireRole(['admin']), manageCategory);
router.patch('/:id/status', requireRole(['admin', 'staff']), updateComplaintStatus);

export default router;
