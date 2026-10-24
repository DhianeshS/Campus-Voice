import type { ComplaintReportData, ComplaintStatus } from '../types';
import type { AuthenticatedUser } from '../middleware/auth';
import { complaintRepository } from './complaint.repository';
import { feedbackRepository } from './feedback.repository';

export const reportRepository = {
  /**
   * Computes comprehensive, transparent reports directly from actual database records.
   * Never fabricates metrics or institutional performance numbers.
   */
  async getReportData(
    filters: {
      dateFrom?: string;
      dateTo?: string;
      category?: string;
      department?: string;
    },
    requester: AuthenticatedUser
  ): Promise<ComplaintReportData> {
    // 1. Fetch complaints within date range and scope
    const { complaints } = await complaintRepository.listComplaints(
      {
        category: filters.category,
        department: filters.department,
        page: 1,
        limit: 5000,
      },
      requester
    );

    // Filter by date range in memory or query
    let filtered = complaints;
    if (filters.dateFrom) {
      const fromTime = new Date(filters.dateFrom).getTime();
      filtered = filtered.filter((c) => new Date(c.createdAt).getTime() >= fromTime);
    }
    if (filters.dateTo) {
      const toTime = new Date(filters.dateTo).getTime();
      filtered = filtered.filter((c) => new Date(c.createdAt).getTime() <= toTime);
    }

    const totalComplaints = filtered.length;
    const resolvedComplaintsList = filtered.filter(
      (c) => c.status === 'resolved' || c.status === 'closed'
    );
    const resolvedComplaints = resolvedComplaintsList.length;
    const openComplaints = totalComplaints - resolvedComplaints;

    // 2. Status Distribution
    const statusCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as ComplaintStatus,
      count,
      percentage: totalComplaints > 0 ? Number(((count / totalComplaints) * 100).toFixed(1)) : 0,
    }));

    // 3. Category Distribution
    const categoryCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: totalComplaints > 0 ? Number(((count / totalComplaints) * 100).toFixed(1)) : 0,
    }));

    // 4. Submissions Over Time (Grouped by Day)
    const dailyCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      const day = c.createdAt ? c.createdAt.split('T')[0] : 'Unknown';
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const submissionsOverTime = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Real Resolution-Time Distributions
    const durationsHours: number[] = [];
    const resolutionTimeDistribution = {
      under24Hours: 0,
      oneToThreeDays: 0,
      threeToSevenDays: 0,
      overSevenDays: 0,
    };

    let slaMetCount = 0;
    const SLA_THRESHOLD_HOURS = 72; // Institutional SLA benchmark: 72 hours

    resolvedComplaintsList.forEach((c) => {
      const createdTime = new Date(c.createdAt).getTime();
      const resolvedTime = c.resolvedAt
        ? new Date(c.resolvedAt).getTime()
        : new Date(c.updatedAt).getTime();

      const hours = Math.max(0.1, (resolvedTime - createdTime) / (1000 * 3600));
      durationsHours.push(hours);

      if (hours < 24) {
        resolutionTimeDistribution.under24Hours++;
      } else if (hours < 72) {
        resolutionTimeDistribution.oneToThreeDays++;
      } else if (hours < 168) {
        resolutionTimeDistribution.threeToSevenDays++;
      } else {
        resolutionTimeDistribution.overSevenDays++;
      }

      if (hours <= SLA_THRESHOLD_HOURS) {
        slaMetCount++;
      }
    });

    durationsHours.sort((a, b) => a - b);
    const avgResolutionHours =
      durationsHours.length > 0
        ? Number((durationsHours.reduce((acc, h) => acc + h, 0) / durationsHours.length).toFixed(1))
        : 0;

    const medianResolutionHours =
      durationsHours.length > 0
        ? Number(durationsHours[Math.floor(durationsHours.length / 2)].toFixed(1))
        : 0;

    const slaComplianceRate =
      resolvedComplaints > 0 ? Number(((slaMetCount / resolvedComplaints) * 100).toFixed(1)) : 100;

    // 6. Department-Level Summaries
    const deptGroups: Record<string, { total: number; resolved: number; inProgress: number; hours: number[] }> = {};
    filtered.forEach((c) => {
      const dept = c.department || 'General Administration';
      if (!deptGroups[dept]) {
        deptGroups[dept] = { total: 0, resolved: 0, inProgress: 0, hours: [] };
      }
      deptGroups[dept].total++;
      if (c.status === 'resolved' || c.status === 'closed') {
        deptGroups[dept].resolved++;
        const created = new Date(c.createdAt).getTime();
        const resolved = c.resolvedAt ? new Date(c.resolvedAt).getTime() : new Date(c.updatedAt).getTime();
        deptGroups[dept].hours.push((resolved - created) / (1000 * 3600));
      } else if (c.status === 'in_progress' || c.status === 'under_review') {
        deptGroups[dept].inProgress++;
      }
    });

    // Fetch aggregate feedback for satisfaction rating per department
    const feedbackList = await feedbackRepository.listFeedback({ page: 1, limit: 1000 });
    const satisfactionMap: Record<string, { sum: number; count: number }> = {};
    feedbackList.feedback.forEach((f) => {
      const cat = f.category || 'general';
      if (!satisfactionMap[cat]) satisfactionMap[cat] = { sum: 0, count: 0 };
      satisfactionMap[cat].sum += f.rating;
      satisfactionMap[cat].count++;
    });

    const departmentSummaries = Object.entries(deptGroups).map(([department, data]) => {
      const avgHours =
        data.hours.length > 0
          ? Number((data.hours.reduce((acc, h) => acc + h, 0) / data.hours.length).toFixed(1))
          : 0;
      const satisfaction = satisfactionMap[department.toLowerCase()];
      const avgSatisfactionRating =
        satisfaction && satisfaction.count > 0
          ? Number((satisfaction.sum / satisfaction.count).toFixed(2))
          : null;

      return {
        department,
        total: data.total,
        resolved: data.resolved,
        inProgress: data.inProgress,
        avgResolutionHours: avgHours,
        avgSatisfactionRating,
      };
    });

    return {
      summary: {
        totalComplaints,
        resolvedComplaints,
        openComplaints,
        avgResolutionHours,
        medianResolutionHours,
        slaComplianceRate,
      },
      statusDistribution,
      categoryDistribution,
      submissionsOverTime,
      resolutionTimeDistribution,
      departmentSummaries,
      metadata: {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        category: filters.category,
        department: filters.department,
        generatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * Generates a safe CSV export of complaints for authorized administrators.
   * Strips or masks confidential student identities to prevent unauthorized disclosure.
   * Neutralizes formula injection characters (=, +, -, @).
   */
  async exportComplaintsCsv(
    filters: {
      dateFrom?: string;
      dateTo?: string;
      category?: string;
      department?: string;
    },
    requester: AuthenticatedUser
  ): Promise<string> {
    const { complaints } = await complaintRepository.listComplaints(
      {
        category: filters.category,
        department: filters.department,
        page: 1,
        limit: 10000,
      },
      requester
    );

    let filtered = complaints;
    if (filters.dateFrom) {
      const fromTime = new Date(filters.dateFrom).getTime();
      filtered = filtered.filter((c) => new Date(c.createdAt).getTime() >= fromTime);
    }
    if (filters.dateTo) {
      const toTime = new Date(filters.dateTo).getTime();
      filtered = filtered.filter((c) => new Date(c.createdAt).getTime() <= toTime);
    }

    const headers = [
      'Reference Number',
      'Title',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Submitted Date',
      'Resolved Date',
      'Resolution Time (Hours)',
      'Assigned To',
      'Complainant Name',
      'Complainant Email',
    ];

    const safeValue = (str: string | undefined | null): string => {
      if (!str) return '""';
      let clean = str.replace(/"/g, '""');
      // Neutralize CSV formula injection attacks (Excel, LibreOffice, Google Sheets)
      if (['=', '+', '-', '@', '\t', '\r', '|', '%'].includes(clean.charAt(0))) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    };

    const rows = filtered.map((c) => {
      const isSensitive = c.isConfidential || c.category === 'harassment_misconduct';
      const isChiefAdmin = requester.role === 'admin';

      const studentName = isSensitive && !isChiefAdmin ? '[Protected Student Identity]' : c.userFullName || 'Student';
      const studentEmail = isSensitive && !isChiefAdmin ? '[Confidential Contact]' : c.userEmail || '';

      let resolutionHours = '';
      if (c.status === 'resolved' || c.status === 'closed') {
        const created = new Date(c.createdAt).getTime();
        const resolved = c.resolvedAt ? new Date(c.resolvedAt).getTime() : new Date(c.updatedAt).getTime();
        resolutionHours = ((resolved - created) / (1000 * 3600)).toFixed(1);
      }

      return [
        safeValue(c.id),
        safeValue(c.title),
        safeValue(c.category),
        safeValue(c.department || 'Unassigned Department'),
        safeValue(c.priority),
        safeValue(c.status),
        safeValue(c.createdAt),
        safeValue(c.resolvedAt || ''),
        safeValue(resolutionHours),
        safeValue(c.assignedToName || 'Unassigned'),
        safeValue(studentName),
        safeValue(studentEmail),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  },
};
