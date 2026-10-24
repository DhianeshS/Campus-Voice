import { Router } from 'express';
import {
  getDashboardMetrics,
  getAdminComplaints,
  assignComplaint,
  requestInfo,
  resolveComplaint,
  closeComplaint,
  reopenComplaint,
  getUsers,
  updateUserRole,
  getAuditLogs,
  getOfficers,
} from '../controllers/admin.controller';
import {
  getCategories,
  manageCategory,
  updateComplaintStatus,
} from '../controllers/complaint.controller';
import { reportController } from '../controllers/report.controller';
import { feedbackController } from '../controllers/feedback.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Enforce backend authorization on all admin routes
router.use(requireAuth);
router.use(requireRole(['admin', 'staff']));

// 1. Dashboard Metrics
router.get('/metrics', getDashboardMetrics);

// 2. Complaint Management Table & Detail Actions
router.get('/complaints', getAdminComplaints);
router.patch('/complaints/:id/assign', assignComplaint);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/request-info', requestInfo);
router.post('/complaints/:id/resolve', resolveComplaint);
router.post('/complaints/:id/close', closeComplaint);
router.post('/complaints/:id/reopen', reopenComplaint);

// 3. Officers list for assignment dropdown
router.get('/officers', getOfficers);

// 4. Category Management
router.get('/categories', getCategories);
router.post('/categories', requireRole(['admin']), manageCategory);

// 5. User Management (Super Admin & Self-escalation check enforced in controller/service)
router.get('/users', requireRole(['admin']), getUsers);
router.patch('/users/:id/role', requireRole(['admin']), updateUserRole);

// 6. Append-only Audit Logs
router.get('/audit-logs', requireRole(['admin']), getAuditLogs);

// 7. Executive Reports & Transparent Analytics
router.get('/reports', reportController.getReports);
router.get('/reports/export', reportController.exportComplaints);

// 8. Administrative Feedback Review & Aggregate Ratings
router.get('/feedback', feedbackController.listAdminFeedback);
router.get('/feedback/metrics', feedbackController.getFeedbackMetrics);

export default router;
