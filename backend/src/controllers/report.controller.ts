import { Request, Response, NextFunction } from 'express';
import { reportRepository } from '../repositories/report.repository';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export const reportController = {
  /**
   * Retrieves live, real database report analytics for administrators.
   */
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError('Authentication required to access reports.', 401, 'UNAUTHORIZED');
      }

      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        category: req.query.category as string,
        department: req.query.department as string,
      };

      const data = await reportRepository.getReportData(filters, authReq.user);

      const response: ApiResponse = {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generates a safe CSV or JSON export of grievance records.
   * Restricts student identification on confidential/whistleblower grievances.
   */
  async exportComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError('Authentication required to export records.', 401, 'UNAUTHORIZED');
      }

      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        category: req.query.category as string,
        department: req.query.department as string,
      };

      const format = (req.query.format as string) || 'csv';

      if (format === 'csv') {
        const csvContent = await reportRepository.exportComplaintsCsv(filters, authReq.user);
        const filename = `campusvoice-report-${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
        return;
      }

      const data = await reportRepository.getReportData(filters, authReq.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
